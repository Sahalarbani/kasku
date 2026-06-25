import { Plus, ReceiptText, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../shared/services/finance';
import { deleteTransactionFromDb } from '../../../shared/services/firebase';
import type { Member, Transaction } from '../../../shared/types/index';
import { SegmentedTabs } from '../../../shared/components/ui/SegmentedTabs';

type Props = {
  filter: string;
  onFilterChange: (value: string) => void;
  transactions: Transaction[];
  members: Member[];
  onCreate: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
};

export function TransactionsView({ filter, onFilterChange, transactions, members, onCreate, onToast }: Props) {
  const memberMap = new Map(members.map((member) => [member.id, member.name]));
  const filtered = transactions.filter((item) => filter === 'all' || item.type === filter);

  async function handleDelete(item: Transaction) {
    if (!confirm('Hapus transaksi ini? Data akan hilang selamanya.')) return;
    try {
      await deleteTransactionFromDb(item.id);
      onToast('Transaksi berhasil dihapus.', 'success');
    } catch {
      onToast('Gagal menghapus transaksi.', 'error');
    }
  }

  return (
    <div className="view-stack page-stack">
      <section className="panel compact-gap">
        <div className="panel-heading">
          <div>
            <h3>Transaksi Kas</h3>
            <p>Pemasukan umum, pengeluaran, dan histori kas.</p>
          </div>
          <button className="primary-button" onClick={onCreate} type="button">
            <Plus size={16} />
            Catat
          </button>
        </div>
        <SegmentedTabs
          onChange={onFilterChange}
          options={[
            { value: 'all', label: 'Semua' },
            { value: 'income', label: 'Masuk' },
            { value: 'expense', label: 'Keluar' },
          ]}
          value={filter}
        />
      </section>

      <section className="panel">
        {filtered.length ? (
          <div className="list-stack">
            {filtered.map((item) => (
              <article className="list-row tall" key={item.id}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{item.note || item.category}</strong>
                  <small>
                    {new Date(item.date).toLocaleDateString('id-ID')} · {item.category}
                    {item.memberId ? ` · ${memberMap.get(item.memberId) ?? 'Anggota'}` : ''}
                  </small>
                </div>
                <div className={`amount-display ${item.type === 'income' ? 'success' : 'danger'}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <strong>
                    {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                  </strong>
                  <button
                    type="button"
                    className="icon-button"
                    style={{ background: 'var(--surface-2)', minHeight: 32, width: 32, color: 'var(--text-secondary)' }}
                    onClick={() => handleDelete(item)}
                    aria-label="Hapus transaksi"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><ReceiptText size={24} /></div>
            <strong>Tidak ada transaksi.</strong>
            <p>Ubah filter atau tambahkan transaksi baru.</p>
          </div>
        )}
      </section>
    </div>
  );
}
