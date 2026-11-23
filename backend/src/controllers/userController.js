import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import { hashPassword, comparePassword } from '../utils/password.js';

export async function searchUsers(req, res) {
  try {
    const q = req.query.q?.trim().toLowerCase();
    if (!q || q.length < 2) {
      return res.json({ success: true, users: [] });
    }

    const currentUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } }
      ]
    })
      .limit(10)
      .select('username fullName email avatar createdAt');

    return res.json({
      success: true,
      users: users.map((u) => u.toSafeObject ? u.toSafeObject() : u)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to search users' });
  }
}

export async function getUserByUsername(req, res) {
  try {
    const username = req.params.username?.trim().toLowerCase();
    const user = await User.findOne({ username }).select('username fullName email avatar createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find shared groups with logged in user
    const sharedGroups = await Group.find({
      $and: [
        { 'members.user': req.user._id },
        { 'members.user': user._id }
      ]
    }).select('name category avatar');

    return res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}`,
        createdAt: user.createdAt,
        sharedGroups
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
}

export async function updateProfile(req, res) {
  try {
    const { fullName, avatar, currentPassword, newPassword } = req.body;
    const user = req.user;

    if (fullName && fullName.trim().length >= 2) {
      user.fullName = fullName.trim();
    }

    if (avatar) {
      user.avatar = avatar;
    }

    if (newPassword) {
      if (user.passwordHash) {
        if (!currentPassword) {
          return res.status(400).json({ success: false, message: 'Current password is required to set new password' });
        }
        const isMatch = await comparePassword(currentPassword, user.passwordHash);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }

      user.passwordHash = await hashPassword(newPassword);
      if (!user.authProviders.includes('local')) {
        user.authProviders.push('local');
      }
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toSafeObject()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
}
