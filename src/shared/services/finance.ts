/* v1.0.2 | Auto decimals formatting fix + Logic payments */
import type { FinanceSnapshot, Member, Transaction } from '../../shared/types';

const money = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return money.format(Number.isFinite(value) ? value : 0);
}

export function formatNumberInput(value: string) {
  // Hanya ambil digit
  const raw = value.replace(/\D/g, '');
  if (!raw) return '';
  // Format desimal indonesia
  return new Intl.NumberFormat('id-ID').format(Number(raw));
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}

export function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function computeSnapshot(
  members: Member[],
  transactions: Transaction[],
  activeMonth = getCurrentMonthKey(),
): FinanceSnapshot {
  const balance = transactions.reduce((total, item) => {
    return total + (item.type === 'income' ? item.amount : -item.amount);
  }, 0);

  const currentMonth = transactions.filter((item) => monthKey(item.date) === activeMonth);
  const monthIncome = currentMonth
    .filter((item) => item.type === 'income')
    .reduce((total, item) => total + item.amount, 0);
  const monthExpense = currentMonth
    .filter((item) => item.type === 'expense')
    .reduce((total, item) => total + item.amount, 0);

  const paidMemberIds = Array.from(
    new Set(
      currentMonth
        .filter((item) => item.type === 'income' && item.category === 'iuran' && item.memberId)
        .map((item) => item.memberId as string),
    ),
  );

  const expectedDueTotal = members.reduce((total, member) => total + member.monthlyDue, 0);
  const collectedDueTotal = currentMonth
    .filter((item) => item.type === 'income' && item.category === 'iuran')
    .reduce((total, item) => total + item.amount, 0);

  return {
    balance,
    monthIncome,
    monthExpense,
    memberCount: members.length,
    expectedDueTotal,
    collectedDueTotal,
    outstandingDueTotal: Math.max(expectedDueTotal - collectedDueTotal, 0),
    paidMemberIds,
  };
}

export function sortByNewest<T extends { date?: string; createdAt: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.date ?? left.createdAt).getTime();
    const rightTime = new Date(right.date ?? right.createdAt).getTime();
    return rightTime - leftTime;
  });
}
