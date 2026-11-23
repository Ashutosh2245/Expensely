export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE';
export type SettlementStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

export interface User {
  _id: string;
  id?: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  authProviders?: string[];
  isEmailVerified?: boolean;
  createdAt?: string;
}

export interface GroupMember {
  user: User;
  role: UserRole;
  joinedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  category: 'Trip' | 'Home' | 'Friends' | 'Couple' | 'Office' | 'Other';
  avatar: string;
  inviteCode: string;
  createdBy: User;
  members: GroupMember[];
  membersCount?: number;
  userNetBalance?: number;
  userNetBalancePaise?: number;
  totalExpenses?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface ExpenseParticipant {
  user: User;
  shareInPaise: number;
  share?: number;
}

export interface Expense {
  _id: string;
  groupId: string | Group;
  description: string;
  amountInPaise: number;
  amount: number;
  paidBy: User;
  participants: ExpenseParticipant[];
  splitType: SplitType;
  category: string;
  date: string;
  receipt?: string;
  notes?: string;
  createdBy: User;
  createdAt?: string;
}

export interface Settlement {
  _id: string;
  groupId: string;
  fromUser: User;
  toUser: User;
  amountInPaise: number;
  amount: number;
  status: SettlementStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  confirmedAt?: string;
  createdBy: User;
  createdAt: string;
}

export interface SimplifiedDebt {
  fromUser: User;
  toUser: User;
  amountPaise: number;
  amount: number;
  amountFormatted: string;
}

export interface MemberBalance {
  userId: string;
  user: User;
  role: UserRole;
  totalPaid: number;
  totalShare: number;
  netBalance: number;
  netBalancePaise: number;
  isCreditor: boolean;
  isDebtor: boolean;
  isSettled: boolean;
}

export interface GroupBalancesResponse {
  groupId: string;
  groupName: string;
  totalExpensesPaise: number;
  totalExpensesFormatted: string;
  membersCount: number;
  balances: MemberBalance[];
  simplifiedDebts: SimplifiedDebt[];
}

export interface UserOverallBalances {
  totalGroupExpenses: number;
  totalOwedToYou: number;
  totalYouOwe: number;
  netBalance: number;
  netBalancePaise: number;
  groups: {
    groupId: string;
    name: string;
    category: string;
    avatar: string;
    netBalance: number;
    netBalancePaise: number;
    totalPaid: number;
    totalShare: number;
  }[];
}

export interface NotificationItem {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedEntity?: {
    entityType: string;
    entityId: string;
  };
  isRead: boolean;
  createdAt: string;
}

export interface ActivityItem {
  _id: string;
  groupId?: {
    _id: string;
    name: string;
    category: string;
    avatar: string;
  };
  userId: User;
  action: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

export interface Friend {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
  since: string;
}

export interface GroupInvitation {
  _id: string;
  groupId: {
    _id: string;
    name: string;
    category: string;
    avatar: string;
    description: string;
  };
  invitedBy: User;
  status: string;
  expiresAt: string;
  createdAt: string;
}
