import { Check, X, BellDot, QrCode, Wallet, Tag } from 'lucide-react';
import { usePaymentRequests, updatePaymentRequestStatus, addTransactionToDb, addYearlyTransactions, useFirebaseData } from '../../../shared/services/firebase';
import { formatCurrency, monthKey } from '../../../shared/services/finance';

export function RequestsView({ onToast }: { onToast: (msg: string, type: 'success' | 'error') => void }) {
  const { requests } = usePaymentRequests();
  const { members, transactions } = useFirebaseData();
  const pendingRequests = requests.filter(r => r.status === 'pending');

  async function handleApprove(req: any) {
    const isYearly = req.paymentType === 'tahunan';
    const reqMonth = req.dueMonth || monthKey(new Date(req.createdAt).toISOString());
    const isPaid = transactions.some(t => t.type === 'income' && t.category === 'iuran' && t.memberId === req.memberId && monthKey(t.date) === reqMonth);
    
    if (isPaid) {
      return onToast(`${req.memberName} sudah berstatus LUNAS untuk tagihan bulan ${reqMonth}. Permintaan ganda ini sebaiknya ditolak.`, 'error');
    }

    if (!confirm(`Terima pembayaran ${isYearly ? 'TAHUNAN ' : ''}Rp${req.amount.toLocaleString()} dari ${req.memberName}?`)) return;

    try {
      if (isYearly) {
        // Cari anggota untuk dapatkan due standar (untuk dibagi 12 jika pakai diskon)
        const member = members.find(m => m.id === req.memberId);
        if (!member) throw new Error('Data anggota tidak ditemukan');
        // Anggap amount adalah total setelah diskon. 
        // addYearlyTransactions butuh amount per bulan yang akan dicatat:
        const perMonth = Math.round(req.amount / 12);
        
        await addYearlyTransactions(req.memberId, req.memberName, perMonth, reqMonth);
      } else {
        await addTransactionToDb({
          type: 'income',
          category: 'iuran',
          amount: req.amount,
          date: reqMonth === monthKey(new Date().toISOString()) ? new Date().toISOString().slice(0, 10) : `${reqMonth}-01`,
          note: `Iuran Bulan ${reqMonth} via ${req.method}`,
          memberId: req.memberId,
        });
      }

      await updatePaymentRequestStatus(req.id, 'approved');
      onToast(`Pembayaran ${isYearly ? 'tahunan' : 'bulanan'} berhasil dikonfirmasi.`, 'success');
    } catch {
      onToast('Gagal memproses pembayaran.', 'error');
    }
  }

  async function handleReject(req: any) {
    if (!confirm('Tolak pembayaran ini?')) return;
    try {
      await updatePaymentRequestStatus(req.id, 'rejected');
      onToast('Pembayaran ditolak.', 'success');
    } catch {
      onToast('Gagal menolak.', 'error');
    }
  }

  return (
    <div className="view-stack page-stack">
      <section className="panel compact-gap">
        <div className="panel-heading">
          <div>
            <h3>Permintaan Pembayaran</h3>
            <p>Notifikasi realtime dari warga yang membayar via aplikasi.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        {pendingRequests.length > 0 ? (
          <div className="list-stack">
            {pendingRequests.map(req => (
              <article className="list-row tall" key={req.id}>
                <div>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {req.memberName}
                    {req.paymentType === 'tahunan' && (
                      <span className="pill success" style={{ padding: '2px 6px', fontSize: 10 }}>TAHUNAN</span>
                    )}
                  </strong>
                  <small style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {req.method === 'QRIS' ? <QrCode size={12}/> : <Wallet size={12}/>}
                    Via {req.method} · {new Date(req.createdAt).toLocaleString('id-ID')}
                  </small>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <strong style={{ color: 'var(--success)' }}>+ {formatCurrency(req.amount)}</strong>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="icon-button" style={{ width: 36, height: 36, background: 'var(--danger-soft)', color: 'var(--danger)' }} onClick={() => handleReject(req)}><X size={16}/></button>
                    <button className="icon-button" style={{ width: 36, height: 36, background: 'var(--success-soft)', color: 'var(--success)' }} onClick={() => handleApprove(req)}><Check size={16}/></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <BellDot size={24} color="var(--text-secondary)" style={{ marginBottom: 12 }} />
            <strong>Tidak ada notifikasi.</strong>
            <p>Belum ada warga yang mengklaim pembayaran.</p>
          </div>
        )}
      </section>
    </div>
  );
}
