import { ActivityLog } from '../models/ActivityLog.js';
import { Group } from '../models/Group.js';

export async function getGroupActivities(req, res) {
  try {
    const groupId = req.params.groupId || req.params.id;
    const activities = await ActivityLog.find({ groupId })
      .populate('userId', 'username fullName avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ success: true, activities });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve activities' });
  }
}

export async function getUserActivities(req, res) {
  try {
    const userId = req.user._id;
    const userGroups = await Group.find({ 'members.user': userId }).select('_id');
    const groupIds = userGroups.map((g) => g._id);

    const activities = await ActivityLog.find({
      $or: [
        { groupId: { $in: groupIds } },
        { userId: userId }
      ]
    })
      .populate('userId', 'username fullName avatar')
      .populate('groupId', 'name category avatar')
      .sort({ createdAt: -1 })
      .limit(60);

    return res.json({ success: true, activities });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve user activities' });
  }
}
