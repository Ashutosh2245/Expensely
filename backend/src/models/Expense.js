import mongoose from 'mongoose';

const expenseParticipantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    shareInPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer paise value'
      }
    }
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer paise value'
      }
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    participants: {
      type: [expenseParticipantSchema],
      required: true,
      validate: {
        validator: function (participants) {
          if (!participants || participants.length === 0) return false;
          const sum = participants.reduce((acc, p) => acc + p.shareInPaise, 0);
          return sum === this.amountInPaise;
        },
        message: 'Sum of individual shares must exactly equal total expense amount'
      }
    },
    splitType: {
      type: String,
      enum: ['EQUAL', 'EXACT', 'PERCENTAGE'],
      default: 'EQUAL'
    },
    category: {
      type: String,
      enum: [
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Accommodation',
        'Groceries',
        'Utilities',
        'Travel',
        'Healthcare',
        'Other'
      ],
      default: 'Other'
    },
    date: {
      type: Date,
      default: Date.now
    },
    receipt: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: '',
      maxlength: 1000
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

expenseSchema.index({ groupId: 1, date: -1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ 'participants.user': 1 });

export const Expense = mongoose.model('Expense', expenseSchema);
