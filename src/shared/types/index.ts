export type ThemeMode = 'light' | 'dark';
export type TransactionType = 'income' | 'expense';
export type TransactionCategory = 'iuran' | 'sumbangan' | 'kegiatan' | 'operasional' | 'perlengkapan' | 'lainnya';

export interface Member {
  id: string;
  name: string;
  phone: string;
  address: string;
  monthlyDue: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  note: string;
  memberId: string | null;
  createdAt: string;
}

export interface FinanceSnapshot {
  balance: number;
  monthIncome: number;
  monthExpense: number;
  memberCount: number;
  expectedDueTotal: number;
  collectedDueTotal: number;
  outstandingDueTotal: number;
  paidMemberIds: string[];
}

export type UserRole = 'pending' | 'warga' | 'admin' | 'rt' | 'developer';

export interface UserDoc {
  uid: string;
  name: string;
  phone: string;
  role: UserRole;
  memberId?: string | null; // legacy
  memberIds?: string[]; // Support multi-anggota (Satu akun banyak nama)
  createdAt: string;
}

export interface PaymentRequest {
  id: string;
  uid: string;
  memberId: string;
  memberName: string;
  amount: number;
  dueMonth: string;
  method: 'QRIS' | 'Tunai';
  status: 'pending' | 'approved' | 'rejected';
  paymentType?: 'bulanan' | 'tahunan'; // New field for type of payment
  createdAt: string;
}

export interface AppLog {
  id: string;
  action: string;
  message: string;
  uid: string;
  createdAt: string;
}
