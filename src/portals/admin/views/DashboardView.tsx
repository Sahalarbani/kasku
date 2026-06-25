/* v2.1.0 | Dashboard page with clean UI */
import { Download, Upload, Banknote, ArrowDownUp } from 'lucide-react';
import { formatCurrency } from '../../../shared/services/finance';
import type { FinanceSnapshot, Member, Transaction } from '../../../shared/types/index';

type Props = {
  snapshot: FinanceSnapshot;
  members: Member[];
  transactions: Transaction[];
  onExport: () => void;
  onImportClick: () => void;
};

export function DashboardView({
  snapshot,
  members,
  transactions,
  onExport,
  onImportClick,
}: Props) {
  const unpaidMembers = members.filter((member) => !snapshot.paidMemberIds.includes(member.id));
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="view-stack page-stack">
      <section className="hero-balance">
        <span className="eyebrow">Saldo kas aktif</span>
        <h2>{formatCurrency(snapshot.balance)}</h2>
        <p>
          Iuran bulan ini terkumpul {formatCurrency(snapshot.collectedDueTotal)} dari target{' '}
          {formatCurrency(snapshot.expectedDueTotal)}.
        </p>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <span>Pemasukan Bulan Ini</span>
          <strong>{formatCurrency(snapshot.monthIncome)}</strong>
        </article>
        <article className="metric-card">
          <span>Pengeluaran Bulan Ini</span>
          <strong>{formatCurrency(snapshot.monthExpense)}</strong>
        </article>
        <article className="metric-card">
          <span>Tunggakan Iuran</span>
          <strong>{formatCurrency(snapshot.outstandingDueTotal)}</strong>
        </article>
        <article className="metric-card">
          <span>Jumlah Anggota</span>
          <strong>{snapshot.memberCount} Orang</strong>
        </article>
      </section>

      <section className="action-grid">
        <button className="action-grid-button" onClick={onExport} type="button">
          <span className="action-icon">
            <Download size={22} />
          </span>
          <span>Export Data</span>
        </button>
        <button className="action-grid-button" onClick={onImportClick} type="button">
          <span className="action-icon">
            <Upload size={22} />
          </span>
          <span>Import JSON</span>
        </button>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Perlu Ditagih</h3>
            <p>Anggota yang belum tercatat membayar bulan ini.</p>
          </div>
        </div>
        {unpaidMembers.length ? (
          <div className="list-stack">
            {unpaidMembers.map((member) => (
              <article className="list-row" key={member.id}>
                <div>
                  <strong>{member.name}</strong>
                  <small>{member.phone || 'Tanpa nomor telepon'}</small>
                </div>
                <span className="pill warning">{formatCurrency(member.monthlyDue)}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Banknote size={24} />
            </div>
            <strong>Semua anggota sudah lunas.</strong>
            <p>Catatan iuran bulan berjalan sudah lengkap.</p>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Riwayat Terbaru</h3>
            <p>Lima transaksi paling baru.</p>
          </div>
        </div>
        {recentTransactions.length ? (
          <div className="list-stack">
            {recentTransactions.map((item) => (
              <article className="list-row" key={item.id}>
                <div>
                  <strong>{item.note || item.category}</strong>
                  <small>{new Date(item.date).toLocaleDateString('id-ID')}</small>
                </div>
                <div className={`amount-display ${item.type === 'income' ? 'success' : 'danger'}`}>
                  <strong>
                    {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                  </strong>
                  <small>{item.category}</small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ArrowDownUp size={24} />
            </div>
            <strong>Belum ada transaksi.</strong>
            <p>Mulai dari pembayaran iuran atau catat transaksi umum pertama.</p>
          </div>
        )}
      </section>
    </div>
  );
}
