import mongoose from 'mongoose';
import crypto from 'crypto';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    description: {
      type: String,
      default: '',
      maxlength: 500
    },
    category: {
      type: String,
      enum: ['Trip', 'Home', 'Friends', 'Couple', 'Office', 'Other'],
      default: 'Other'
    },
    avatar: {
      type: String,
      default: ''
    },
    inviteCode: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(6).toString('hex')
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        role: {
          type: String,
          enum: ['OWNER', 'ADMIN', 'MEMBER'],
          default: 'MEMBER'
        },
        joinedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

groupSchema.index({ 'members.user': 1 });

export const Group = mongoose.model('Group', groupSchema);
