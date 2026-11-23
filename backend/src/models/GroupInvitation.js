import mongoose from 'mongoose';
import crypto from 'crypto';

const groupInvitationSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    invitedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    invitedEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null
    },
    token: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(24).toString('hex')
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'REVOKED'],
      default: 'PENDING'
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  },
  {
    timestamps: true
  }
);

groupInvitationSchema.index({ groupId: 1, invitedUser: 1, status: 1 });

export const GroupInvitation = mongoose.model('GroupInvitation', groupInvitationSchema);
