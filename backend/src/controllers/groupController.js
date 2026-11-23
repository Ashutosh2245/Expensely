import { Group } from '../models/Group.js';
import { User } from '../models/User.js';
import { GroupInvitation } from '../models/GroupInvitation.js';
import { Expense } from '../models/Expense.js';
import { Settlement } from '../models/Settlement.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { calculateGroupBalances } from '../services/balanceService.js';
import { emitToGroup, emitToUser } from '../sockets/socketHandler.js';
import { sendEmail } from '../utils/mailer.js';

export async function createGroup(req, res) {
  try {
    const { name, description, category, avatar } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Group name must be at least 2 characters' });
    }

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || '',
      category: category || 'Other',
      avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name.trim())}`,
      createdBy: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'OWNER',
          joinedAt: new Date()
        }
      ]
    });

    await ActivityLog.create({
      groupId: group._id,
      userId: req.user._id,
      action: 'GROUP_CREATED',
      description: `${req.user.fullName} created the group "${group.name}".`
    });

    const populatedGroup = await Group.findById(group._id).populate('members.user', 'username fullName email avatar');

    return res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: populatedGroup
    });
  } catch (err) {
    console.error('[createGroup] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create group' });
  }
}

export async function getGroups(req, res) {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ 'members.user': userId })
      .populate('members.user', 'username fullName email avatar')
      .populate('createdBy', 'username fullName email avatar')
      .sort({ updatedAt: -1 });

    const groupsWithBalances = await Promise.all(
      groups.map(async (grp) => {
        const balData = await calculateGroupBalances(grp._id);
        const myBal = balData.balances.find((b) => b.userId === userId.toString());
        return {
          _id: grp._id,
          name: grp.name,
          description: grp.description,
          category: grp.category,
          avatar: grp.avatar,
          inviteCode: grp.inviteCode,
          membersCount: grp.members.length,
          members: grp.members,
          createdBy: grp.createdBy,
          userNetBalance: myBal ? myBal.netBalance : 0,
          userNetBalancePaise: myBal ? myBal.netBalancePaise : 0,
          totalExpenses: balData.totalExpensesFormatted,
          updatedAt: grp.updatedAt
        };
      })
    );

    return res.json({ success: true, groups: groupsWithBalances });
  } catch (err) {
    console.error('[getGroups] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch groups' });
  }
}

export async function getGroupById(req, res) {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId)
      .populate('members.user', 'username fullName email avatar')
      .populate('createdBy', 'username fullName email avatar');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const userIdStr = req.user._id.toString();
    const isMember = group.members.some((m) => m.user && m.user._id.toString() === userIdStr);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not a member of this group' });
    }

    const balances = await calculateGroupBalances(group._id);
    const myRole = group.members.find((m) => m.user && m.user._id.toString() === userIdStr)?.role || 'MEMBER';

    return res.json({
      success: true,
      group,
      balances,
      currentUserRole: myRole
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch group details' });
  }
}

export async function updateGroup(req, res) {
  try {
    const group = req.group;
    const { name, description, category, avatar } = req.body;

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (category) group.category = category;
    if (avatar) group.avatar = avatar;

    await group.save();

    await ActivityLog.create({
      groupId: group._id,
      userId: req.user._id,
      action: 'GROUP_UPDATED',
      description: `${req.user.fullName} updated group settings.`
    });

    emitToGroup(group._id, 'group:updated', group);

    return res.json({ success: true, message: 'Group updated successfully', group });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update group' });
  }
}

export async function deleteGroup(req, res) {
  try {
    const groupId = req.params.id;
    const group = req.group;

    // Remove expenses, settlements, invitations
    await Expense.deleteMany({ groupId });
    await Settlement.deleteMany({ groupId });
    await GroupInvitation.deleteMany({ groupId });
    await ActivityLog.deleteMany({ groupId });
    await Group.deleteOne({ _id: groupId });

    emitToGroup(groupId, 'group:deleted', { groupId });

    return res.json({ success: true, message: 'Group deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete group' });
  }
}

export async function inviteMember(req, res) {
  try {
    const group = req.group;
    const { identifier } = req.body; // username or email

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Username or email is required' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const userToInvite = await User.findOne({
      $or: [{ username: cleanId }, { email: cleanId }]
    });

    if (userToInvite) {
      const alreadyMember = group.members.some(
        (m) => m.user.toString() === userToInvite._id.toString()
      );
      if (alreadyMember) {
        return res.status(400).json({ success: false, message: `${userToInvite.fullName} is already a member of this group` });
      }

      // Check existing pending invitation
      const existingInvite = await GroupInvitation.findOne({
        groupId: group._id,
        invitedUser: userToInvite._id,
        status: 'PENDING'
      });

      if (existingInvite) {
        return res.status(400).json({ success: false, message: 'An invitation is already pending for this user' });
      }

      const invitation = await GroupInvitation.create({
        groupId: group._id,
        invitedBy: req.user._id,
        invitedUser: userToInvite._id,
        status: 'PENDING'
      });

      const notif = await Notification.create({
        userId: userToInvite._id,
        type: 'GROUP_INVITE',
        title: 'Group Invitation',
        message: `${req.user.fullName} invited you to join "${group.name}".`,
        relatedEntity: {
          entityType: 'group',
          entityId: group._id
        }
      });

      emitToUser(userToInvite._id, 'notification:new', notif);

      return res.status(201).json({
        success: true,
        message: `Invitation sent to ${userToInvite.fullName}`,
        invitation
      });
    } else {
      // Invite by email for unregistered user
      if (!cleanId.includes('@')) {
        return res.status(404).json({ success: false, message: 'User not found with this username' });
      }

      const invitation = await GroupInvitation.create({
        groupId: group._id,
        invitedBy: req.user._id,
        invitedEmail: cleanId,
        status: 'PENDING'
      });

      const inviteLink = `http://localhost:5173/join/${group.inviteCode}`;
      await sendEmail({
        to: cleanId,
        subject: `Join ${req.user.fullName} on EXPENSELY – "${group.name}"`,
        text: `You have been invited to join the group "${group.name}" on EXPENSELY. Click here: ${inviteLink}`
      });

      return res.status(201).json({
        success: true,
        message: `Invitation email sent to ${cleanId}`,
        invitation
      });
    }
  } catch (err) {
    console.error('[inviteMember] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send invitation' });
  }
}

export async function joinByInviteCode(req, res) {
  try {
    const { inviteCode } = req.params;
    const group = await Group.findOne({ inviteCode });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invite link' });
    }

    const userIdStr = req.user._id.toString();
    const alreadyMember = group.members.some((m) => m.user.toString() === userIdStr);
    if (alreadyMember) {
      return res.json({ success: true, message: 'You are already a member of this group', groupId: group._id });
    }

    group.members.push({
      user: req.user._id,
      role: 'MEMBER',
      joinedAt: new Date()
    });

    await group.save();

    await ActivityLog.create({
      groupId: group._id,
      userId: req.user._id,
      action: 'MEMBER_JOINED',
      description: `${req.user.fullName} joined the group via link.`
    });

    emitToGroup(group._id, 'member:joined', {
      user: req.user.toSafeObject(),
      role: 'MEMBER'
    });

    return res.json({
      success: true,
      message: `You successfully joined "${group.name}"!`,
      groupId: group._id
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to join group' });
  }
}

export async function addMember(req, res) {
  try {
    const group = req.group;
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Username or email is required' });
    }

    // Only OWNER or ADMIN can directly add members
    if (req.membership.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Only group owners or admins can directly add members' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const userToAdd = await User.findOne({
      $or: [{ username: cleanId }, { email: cleanId }]
    });

    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'No registered user found with this username or email' });
    }

    // Check if user is already a member
    if (group.members.some((m) => m.user.toString() === userToAdd._id.toString())) {
      return res.status(400).json({ success: false, message: 'User is already a member of this group' });
    }

    group.members.push({
      user: userToAdd._id,
      role: 'MEMBER',
      joinedAt: new Date()
    });

    await group.save();

    await ActivityLog.create({
      groupId: group._id,
      userId: req.user._id,
      action: 'MEMBER_JOINED',
      description: `${req.user.fullName} added ${userToAdd.fullName} to the group.`
    });

    emitToGroup(group._id, 'member:joined', {
      user: userToAdd.toSafeObject(),
      role: 'MEMBER'
    });

    return res.status(201).json({
      success: true,
      message: `${userToAdd.fullName} added to the group!`,
      member: {
        user: userToAdd.toSafeObject(),
        role: 'MEMBER',
        joinedAt: new Date()
      }
    });
  } catch (err) {
    console.error('[addMember] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add member' });
  }
}

export async function removeMember(req, res) {
  try {
    const group = req.group;
    const memberUserId = req.params.memberId;
    const isSelfLeaving = memberUserId === req.user._id.toString();

    // Check permissions
    if (!isSelfLeaving && req.membership.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Only group admins or owners can remove members' });
    }

    const targetMember = group.members.find((m) => m.user.toString() === memberUserId);
    if (!targetMember) {
      return res.status(404).json({ success: false, message: 'Member not found in group' });
    }

    // Only owner can remove someone else, no one can remove the owner except owner leaving themselves
    if (!isSelfLeaving && targetMember.role === 'OWNER') {
      return res.status(400).json({ success: false, message: 'Group owner cannot be removed.' });
    }

    // Check if user has unsettled balances
    const balData = await calculateGroupBalances(group._id);
    const memberBal = balData.balances.find((b) => b.userId === memberUserId);
    if (memberBal && Math.abs(memberBal.netBalancePaise) > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot ${isSelfLeaving ? 'leave' : 'remove member'} with an unsettled balance of ₹${Math.abs(memberBal.netBalance).toFixed(2)}. Please settle all dues first.`
      });
    }

    // If owner is leaving themselves
    if (isSelfLeaving && targetMember.role === 'OWNER') {
      if (group.members.length === 1) {
        await Group.findByIdAndDelete(group._id);
        return res.json({ success: true, message: 'You left and the group was closed.' });
      }
      // Reassign ownership to next member
      const nextOwner = group.members.find((m) => m.user.toString() !== memberUserId);
      if (nextOwner) {
        nextOwner.role = 'OWNER';
      }
    }

    group.members = group.members.filter((m) => m.user.toString() !== memberUserId);
    await group.save();

    const removedUser = await User.findById(memberUserId);

    await ActivityLog.create({
      groupId: group._id,
      userId: req.user._id,
      action: isSelfLeaving ? 'MEMBER_LEFT' : 'MEMBER_REMOVED',
      description: isSelfLeaving
        ? `${req.user.fullName} left the group.`
        : `${req.user.fullName} removed ${removedUser ? removedUser.fullName : 'a member'} from the group.`
    });

    emitToGroup(group._id, 'member:removed', { userId: memberUserId });

    return res.json({ success: true, message: isSelfLeaving ? 'You successfully left the group' : 'Member removed successfully' });
  } catch (err) {
    console.error('[removeMember] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process member removal' });
  }
}
