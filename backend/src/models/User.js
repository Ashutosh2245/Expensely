import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_.-]+$/
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    passwordHash: {
      type: String,
      default: null
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    avatar: {
      type: String,
      default: ''
    },
    googleId: {
      type: String,
      default: null,
      sparse: true
    },
    authProviders: {
      type: [String],
      enum: ['local', 'google'],
      default: ['local']
    },
    isEmailVerified: {
      type: Boolean,
      default: true
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Virtual for formatted user representation
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    username: this.username,
    email: this.email,
    fullName: this.fullName,
    avatar: this.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(this.fullName)}`,
    authProviders: this.authProviders,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt
  };
};

export const User = mongoose.model('User', userSchema);
