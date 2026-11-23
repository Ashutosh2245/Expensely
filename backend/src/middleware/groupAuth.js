import { Group } from '../models/Group.js';

export async function requireGroupMember(req, res, next) {
  try {
    const groupId = req.params.groupId || req.params.id || req.body.groupId;
    if (!groupId) {
      return res.status(400).json({ success: false, message: 'Group ID is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const userIdStr = req.user._id.toString();
    const membership = group.members.find((m) => m.user.toString() === userIdStr);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this group'
      });
    }

    req.group = group;
    req.membership = membership;
    next();
  } catch (err) {
    console.error('[requireGroupMember] Error:', err);
    return res.status(500).json({ success: false, message: 'Server error checking group access' });
  }
}

export async function requireGroupAdmin(req, res, next) {
  try {
    await requireGroupMember(req, res, () => {
      if (req.membership.role !== 'OWNER' && req.membership.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Requires group Admin or Owner role'
        });
      }
      next();
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error checking group admin role' });
  }
}

export async function requireGroupOwner(req, res, next) {
  try {
    await requireGroupMember(req, res, () => {
      if (req.membership.role !== 'OWNER') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Requires group Owner role'
        });
      }
      next();
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error checking group owner role' });
  }
}
