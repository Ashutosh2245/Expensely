import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import { Expense } from '../models/Expense.js';
import { Settlement } from '../models/Settlement.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Notification } from '../models/Notification.js';
import { hashPassword } from '../utils/password.js';
import { calculateEqualSplit } from './splitEngine.js';
import { calculateGroupBalances } from '../services/balanceService.js';

export async function runSeed() {
  console.log('[Seed] Starting database seed...');
  await connectDB();

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Group.deleteMany({}),
    Expense.deleteMany({}),
    Settlement.deleteMany({}),
    FriendRequest.deleteMany({}),
    ActivityLog.deleteMany({}),
    Notification.deleteMany({})
  ]);

  const defaultPasswordHash = await hashPassword('password123');

  // 1. Create Users
  const usersData = [
    {
      username: 'ashutosh',
      email: 'ashutosh@expensely.app',
      fullName: 'Ashutosh Kumar',
      passwordHash: defaultPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      authProviders: ['local']
    },
    {
      username: 'rahul',
      email: 'rahul@expensely.app',
      fullName: 'Rahul Sharma',
      passwordHash: defaultPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      authProviders: ['local']
    },
    {
      username: 'aman',
      email: 'aman@expensely.app',
      fullName: 'Aman Verma',
      passwordHash: defaultPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      authProviders: ['local']
    },
    {
      username: 'priya',
      email: 'priya@expensely.app',
      fullName: 'Priya Singh',
      passwordHash: defaultPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      authProviders: ['local']
    }
  ];

  const users = await User.insertMany(usersData);
  const [ashutosh, rahul, aman, priya] = users;
  console.log(`[Seed] Created ${users.length} demo users (Password: password123)`);

  // 2. Establish Friendships
  await FriendRequest.insertMany([
    { sender: ashutosh._id, receiver: rahul._id, status: 'ACCEPTED' },
    { sender: ashutosh._id, receiver: aman._id, status: 'ACCEPTED' },
    { sender: ashutosh._id, receiver: priya._id, status: 'ACCEPTED' },
    { sender: rahul._id, receiver: aman._id, status: 'ACCEPTED' }
  ]);

  // 3. Create Groups
  const goaTrip = await Group.create({
    name: 'Goa Trip 2026',
    description: 'Beach holiday, villa stay, watersports, and beachside dinners',
    category: 'Trip',
    avatar: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=300',
    createdBy: ashutosh._id,
    members: [
      { user: ashutosh._id, role: 'OWNER' },
      { user: rahul._id, role: 'ADMIN' },
      { user: aman._id, role: 'MEMBER' },
      { user: priya._id, role: 'MEMBER' }
    ]
  });

  const roommates = await Group.create({
    name: 'College Roommates',
    description: 'Monthly flat rent, groceries, internet, and electricity bills',
    category: 'Home',
    avatar: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300',
    createdBy: rahul._id,
    members: [
      { user: rahul._id, role: 'OWNER' },
      { user: ashutosh._id, role: 'ADMIN' },
      { user: aman._id, role: 'MEMBER' }
    ]
  });

  const weekendHangout = await Group.create({
    name: 'Weekend Hangout',
    description: 'Cafes, movies, bowling, and gaming nights',
    category: 'Friends',
    avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300',
    createdBy: ashutosh._id,
    members: [
      { user: ashutosh._id, role: 'OWNER' },
      { user: rahul._id, role: 'MEMBER' },
      { user: priya._id, role: 'MEMBER' }
    ]
  });

  console.log('[Seed] Created 3 collaborative groups');

  // 4. Create Expenses for Goa Trip
  const goaExpenses = [
    {
      groupId: goaTrip._id,
      description: 'Luxury Beach Villa Booking (2 Nights)',
      amountInPaise: 2400000, // ₹24,000
      paidBy: ashutosh._id,
      participants: calculateEqualSplit(2400000, [ashutosh._id.toString(), rahul._id.toString(), aman._id.toString(), priya._id.toString()]),
      splitType: 'EQUAL',
      category: 'Accommodation',
      date: new Date('2026-03-10'),
      createdBy: ashutosh._id
    },
    {
      groupId: goaTrip._id,
      description: 'Seafood Dinner at Thalassa',
      amountInPaise: 480000, // ₹4,800
      paidBy: rahul._id,
      participants: calculateEqualSplit(480000, [ashutosh._id.toString(), rahul._id.toString(), aman._id.toString(), priya._id.toString()]),
      splitType: 'EQUAL',
      category: 'Food & Dining',
      date: new Date('2026-03-11'),
      createdBy: rahul._id
    },
    {
      groupId: goaTrip._id,
      description: 'Scuba Diving & Jet Ski Rental',
      amountInPaise: 600000, // ₹6,000
      paidBy: aman._id,
      participants: calculateEqualSplit(600000, [ashutosh._id.toString(), rahul._id.toString(), aman._id.toString()]), // Priya did not dive
      splitType: 'EQUAL',
      category: 'Entertainment',
      date: new Date('2026-03-12'),
      createdBy: aman._id
    },
    {
      groupId: goaTrip._id,
      description: 'Airport Cab to Villa',
      amountInPaise: 180000, // ₹1,800
      paidBy: priya._id,
      participants: calculateEqualSplit(180000, [ashutosh._id.toString(), rahul._id.toString(), aman._id.toString(), priya._id.toString()]),
      splitType: 'EQUAL',
      category: 'Transportation',
      date: new Date('2026-03-10'),
      createdBy: priya._id
    }
  ];

  await Expense.insertMany(goaExpenses);

  // 5. Create Roommate Expenses
  const roommateExpenses = [
    {
      groupId: roommates._id,
      description: 'Monthly High-Speed Fiber Internet',
      amountInPaise: 150000, // ₹1,500
      paidBy: ashutosh._id,
      participants: calculateEqualSplit(150000, [ashutosh._id.toString(), rahul._id.toString(), aman._id.toString()]),
      splitType: 'EQUAL',
      category: 'Utilities',
      date: new Date('2026-03-01'),
      createdBy: ashutosh._id
    },
    {
      groupId: roommates._id,
      description: 'Weekly Organic Grocery Stock',
      amountInPaise: 330000, // ₹3,300
      paidBy: rahul._id,
      participants: calculateEqualSplit(330000, [ashutosh._id.toString(), rahul._id.toString(), aman._id.toString()]),
      splitType: 'EQUAL',
      category: 'Groceries',
      date: new Date('2026-03-05'),
      createdBy: rahul._id
    }
  ];

  await Expense.insertMany(roommateExpenses);

  // 6. Record a confirmed settlement: Priya settled ₹2,000 to Ashutosh
  await Settlement.create({
    groupId: goaTrip._id,
    fromUser: priya._id,
    toUser: ashutosh._id,
    amountInPaise: 200000, // ₹2,000
    status: 'CONFIRMED',
    paymentMethod: 'UPI',
    notes: 'Partial settlement for beach villa booking',
    confirmedAt: new Date(),
    createdBy: priya._id
  });

  // 7. Add Activity Logs
  await ActivityLog.insertMany([
    {
      groupId: goaTrip._id,
      userId: ashutosh._id,
      action: 'EXPENSE_ADDED',
      description: 'Ashutosh Kumar added "Luxury Beach Villa Booking (2 Nights)" for ₹24,000.00.'
    },
    {
      groupId: goaTrip._id,
      userId: rahul._id,
      action: 'EXPENSE_ADDED',
      description: 'Rahul Sharma added "Seafood Dinner at Thalassa" for ₹4,800.00.'
    },
    {
      groupId: goaTrip._id,
      userId: priya._id,
      action: 'SETTLEMENT_CONFIRMED',
      description: 'Priya Singh settled ₹2,000.00 with Ashutosh Kumar via UPI.'
    }
  ]);

  // 8. Notifications
  await Notification.insertMany([
    {
      userId: ashutosh._id,
      type: 'SETTLEMENT_CONFIRMED',
      title: 'Payment Received',
      message: 'Priya Singh settled ₹2,000.00 with you in "Goa Trip 2026".',
      isRead: false
    },
    {
      userId: rahul._id,
      type: 'EXPENSE_ADDED',
      title: 'New Expense Added',
      message: 'Ashutosh Kumar added "Monthly High-Speed Fiber Internet" in "College Roommates".',
      isRead: false
    }
  ]);

  // Log calculated balances to verify
  const goaBal = await calculateGroupBalances(goaTrip._id);
  console.log('[Seed] Goa Trip 2026 Balance Summary:');
  goaBal.balances.forEach((b) => {
    console.log(`  - ${b.user.fullName}: Paid ₹${b.totalPaid}, Share ₹${b.totalShare}, Net ${b.netBalance >= 0 ? '+' : ''}₹${b.netBalance}`);
  });

  console.log('[Seed] Simplified Settlements Suggested:');
  goaBal.simplifiedDebts.forEach((s) => {
    console.log(`  👉 ${s.fromUser.fullName} pays ${s.toUser.fullName} ₹${s.amountFormatted}`);
  });

  console.log('[Seed] Database seeded successfully!');
}

// Allow direct execution
if (process.argv[1]?.endsWith('seed.js')) {
  runSeed()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('[Seed Error]', e);
      await disconnectDB();
      process.exit(1);
    });
}
