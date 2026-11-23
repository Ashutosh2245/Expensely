import { FriendRequest } from '../models/FriendRequest.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { emitToUser } from '../sockets/socketHandler.js';

export async function sendFriendRequest(req, res) {
  try {
    const { identifier } = req.body; // username or email
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Friend username or email is required' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const receiver = await User.findOne({
      $or: [{ username: cleanId }, { email: cleanId }]
    });

    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (receiver._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot add yourself as a friend' });
    }

    // Check if a request already exists between these two users
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: receiver._id },
        { sender: receiver._id, receiver: req.user._id }
      ]
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return res.status(400).json({ success: false, message: 'You are already friends with this user' });
      }
      if (existing.status === 'PENDING') {
        return res.status(400).json({ success: false, message: 'A pending friend request already exists' });
      }
      // If rejected earlier, reopen as pending
      existing.sender = req.user._id;
      existing.receiver = receiver._id;
      existing.status = 'PENDING';
      await existing.save();
    } else {
      await FriendRequest.create({
        sender: req.user._id,
        receiver: receiver._id,
        status: 'PENDING'
      });
    }

    // Create notification for receiver
    const notif = await Notification.create({
      userId: receiver._id,
      type: 'FRIEND_REQUEST',
      title: 'New Friend Request',
      message: `${req.user.fullName} (@${req.user.username}) sent you a friend request.`,
      relatedEntity: {
        entityType: 'friend_request',
        entityId: req.user._id
      }
    });

    emitToUser(receiver._id, 'notification:new', notif);

    return res.status(201).json({
      success: true,
      message: `Friend request sent to ${receiver.fullName}`
    });
  } catch (err) {
    console.error('[sendFriendRequest] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send friend request' });
  }
}

export async function getFriends(req, res) {
  try {
    const userId = req.user._id;
    const acceptedRequests = await FriendRequest.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: 'ACCEPTED'
    })
      .populate('sender', 'username fullName email avatar')
      .populate('receiver', 'username fullName email avatar');

    const friends = acceptedRequests.map((reqDoc) => {
      const isSender = reqDoc.sender._id.toString() === userId.toString();
      const friendUser = isSender ? reqDoc.receiver : reqDoc.sender;
      return {
        _id: friendUser._id,
        username: friendUser.username,
        fullName: friendUser.fullName,
        email: friendUser.email,
        avatar: friendUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(friendUser.fullName)}`,
        since: reqDoc.updatedAt
      };
    });

    return res.json({ success: true, friends });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve friends' });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const userId = req.user._id;

    const incoming = await FriendRequest.find({
      receiver: userId,
      status: 'PENDING'
    }).populate('sender', 'username fullName email avatar');

    const outgoing = await FriendRequest.find({
      sender: userId,
      status: 'PENDING'
    }).populate('receiver', 'username fullName email avatar');

    return res.json({
      success: true,
      incoming,
      outgoing
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve friend requests' });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const requestId = req.params.id;
    const friendReq = await FriendRequest.findOne({
      _id: requestId,
      receiver: req.user._id,
      status: 'PENDING'
    }).populate('sender', 'username fullName avatar');

    if (!friendReq) {
      return res.status(404).json({ success: false, message: 'Friend request not found or already processed' });
    }

    friendReq.status = 'ACCEPTED';
    await friendReq.save();

    // Create notification for sender
    const notif = await Notification.create({
      userId: friendReq.sender._id,
      type: 'FRIEND_ACCEPTED',
      title: 'Friend Request Accepted',
      message: `${req.user.fullName} (@${req.user.username}) accepted your friend request.`,
      relatedEntity: {
        entityType: 'friend_request',
        entityId: req.user._id
      }
    });

    emitToUser(friendReq.sender._id, 'notification:new', notif);

    return res.json({
      success: true,
      message: `You and ${friendReq.sender.fullName} are now friends!`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to accept friend request' });
  }
}

export async function rejectFriendRequest(req, res) {
  try {
    const requestId = req.params.id;
    const friendReq = await FriendRequest.findOne({
      _id: requestId,
      receiver: req.user._id,
      status: 'PENDING'
    });

    if (!friendReq) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    friendReq.status = 'REJECTED';
    await friendReq.save();

    return res.json({ success: true, message: 'Friend request declined' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to decline friend request' });
  }
}

export async function removeFriend(req, res) {
  try {
    const friendId = req.params.id;
    await FriendRequest.deleteOne({
      $or: [
        { sender: req.user._id, receiver: friendId, status: 'ACCEPTED' },
        { sender: friendId, receiver: req.user._id, status: 'ACCEPTED' }
      ]
    });

    return res.json({ success: true, message: 'Friend removed' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to remove friend' });
  }
}
