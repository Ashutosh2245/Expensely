import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        'GROUP_INVITE',
        'GROUP_JOINED',
        'MEMBER_REMOVED',
        'EXPENSE_ADDED',
        'EXPENSE_UPDATED',
        'EXPENSE_DELETED',
        'SETTLEMENT_REQUESTED',
        'SETTLEMENT_CONFIRMED',
        'SETTLEMENT_REJECTED',
        'FRIEND_REQUEST',
        'FRIEND_ACCEPTED'
      ]
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['group', 'expense', 'settlement', 'friend_request'],
        default: null
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      }
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
