import { GroupInvitation } from '../models/GroupInvitation.js';
import { Group } from '../models/Group.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Notification } from '../models/Notification.js';
import { emitToGroup, emitToUser } from '../sockets/socketHandler.js';

export async function getInvitations(req, res) {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;

    const invitations = await GroupInvitation.find({
      $or: [{ invitedUser: userId }, { invitedEmail: userEmail }],
      status: 'PENDING',
      expiresAt: { $gt: new Date() }
    })
      .populate('groupId', 'name category avatar description')
      .populate('invitedBy', 'username fullName avatar');

    return res.json({ success: true, invitations });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve invitations' });
  }
}

export async function acceptInvitation(req, res) {
  try {
    const inviteId = req.params.id;
    const invitation = await GroupInvitation.findById(inviteId);

    if (!invitation || invitation.status !== 'PENDING') {
      return res.status(404).json({ success: false, message: 'Invitation not found or no longer pending' });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'REVOKED';
      await invitation.save();
      return res.status(400).json({ success: false, message: 'This invitation has expired' });
    }

    const group = await Group.findById(invitation.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group no longer exists' });
    }

    const userIdStr = req.user._id.toString();
    const alreadyMember = group.members.some((m) => m.user.toString() === userIdStr);

    if (!alreadyMember) {
      group.members.push({
        user: req.user._id,
        role: 'MEMBER',
        joinedAt: new Date()
      });
      await group.save();
    }

    invitation.status = 'ACCEPTED';
    invitation.invitedUser = req.user._id;
    await invitation.save();

    await ActivityLog.create({
      groupId: group._id,
      userId: req.user._id,
      action: 'MEMBER_JOINED',
      description: `${req.user.fullName} joined the group.`
    });

    // Notify the person who sent the invite
    const notif = await Notification.create({
      userId: invitation.invitedBy,
      type: 'GROUP_JOINED',
      title: 'Invitation Accepted',
      message: `${req.user.fullName} accepted your invitation to "${group.name}".`,
      relatedEntity: {
        entityType: 'group',
        entityId: group._id
      }
    });

    emitToUser(invitation.invitedBy, 'notification:new', notif);
    emitToGroup(group._id, 'member:joined', {
      user: req.user.toSafeObject(),
      role: 'MEMBER'
    });

    return res.json({
      success: true,
      message: `You have successfully joined "${group.name}"!`,
      groupId: group._id
    });
  } catch (err) {
    console.error('[acceptInvitation] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to accept invitation' });
  }
}

export async function rejectInvitation(req, res) {
  try {
    const inviteId = req.params.id;
    const invitation = await GroupInvitation.findById(inviteId);

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    invitation.status = 'REJECTED';
    await invitation.save();

    return res.json({ success: true, message: 'Invitation declined' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to decline invitation' });
  }
}
