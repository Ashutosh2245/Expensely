import { Notification } from '../models/Notification.js';

export async function getNotifications(req, res) {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications' });
  }
}

export async function markAsRead(req, res) {
  try {
    const notif = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (notif) {
      notif.isRead = true;
      await notif.save();
    }

    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
}

export async function markAllAsRead(req, res) {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark notifications read' });
  }
}
