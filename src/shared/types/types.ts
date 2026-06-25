/* v1.1.0 | 2026-06-20 | Shared app types with explicit app pages */
export type ThemeMode = 'light' | 'dark';

export type TabKey = 'home' | 'payments' | 'transactions' | 'members';

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'iuran'
  | 'sumbangan'
  | 'kegiatan'
  | 'operasional'
  | 'perlengkapan'
  | 'lainnya';

export type Member = {
  id: string;
  name: string;
  phone: string;
  address: string;
  monthlyDue: number;
  createdAt: string;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  note: string;
  memberId: string | null;
  createdAt: string;
};

export type FinanceSnapshot = {
  balance: number;
  monthIncome: number;
  monthExpense: number;
  memberCount: number;
  expectedDueTotal: number;
  collectedDueTotal: number;
  outstandingDueTotal: number;
  paidMemberIds: string[];
};
