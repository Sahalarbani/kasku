/* v2.0.0 | Bayar bulanan & tahunan + kalkulasi diskon realtime */
import { useState } from 'react';
import { Banknote, CircleAlert, Search, CalendarDays, Tag } from 'lucide-react';
import { PremiumDropdown } from '../../../shared/components/ui/PremiumDropdown';
import { formatCurrency, formatNumberInput, getCurrentMonthKey } from '../../../shared/services/finance';
import { useAppSetting } from '../../../shared/services/firebase';
import type { Member } from '../../../shared/types/index';

type PaymentDraft = {
  memberId: string;
  amount: string;
  date: string;
  note: string;
};

type Props = {
  members: Member[];
  paidMemberIds: string[];
  draft: PaymentDraft;
  onDraftChange: (draft: PaymentDraft) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  // callback tambahan untuk bayar tahunan langsung dari admin
  onSubmitYearly?: (memberId: string, memberName: string, monthlyAmount: number, startMonth: string) => Promise<void>;
};

type PayMode = 'bulanan' | 'tahunan';

function todayMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function PaymentsView({ members, paidMemberIds, draft, onDraftChange, onSubmit, onSubmitYearly }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [payMode, setPayMode] = useState<PayMode>('bulanan');
  const [yearlyStartMonth, setYearlyStartMonth] = useState(todayMonth());
  const [yearlyLoading, setYearlyLoading] = useState(false);

  const { value: yearlyDiscountPct } = useAppSetting('yearlyDiscountPct', '10');
  const { value: dueDay } = useAppSetting('dueDay', '10');
  const discountPct = Number(yearlyDiscountPct) || 0;

  const paidSet = new Set(paidMemberIds);
  const unpaidMembers = members.filter((m) => !paidSet.has(m.id));

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const memberOptions = filteredMembers.map((m) => ({
    value: m.id,
    label: m.name,
    meta: `${formatCurrency(m.monthlyDue)} / bulan`,
  }));

  const selectedMember = members.find((m) => m.id === draft.memberId) ?? null;

  // Kalkulasi tahunan
  const monthlyAmount = selectedMember ? selectedMember.monthlyDue : 0;
  const normalYearly = monthlyAmount * 12;
  const discountAmount = Math.round(normalYearly * (discountPct / 100));
  const finalYearly = normalYearly - discountAmount;
  const perMonthAfterDiscount = discountPct > 0 ? Math.round(finalYearly / 12) : monthlyAmount;

  async function handleYearlySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedMember || !onSubmitYearly) return;
    setYearlyLoading(true);
    try {
      await onSubmitYearly(selectedMember.id, selectedMember.name, perMonthAfterDiscount, yearlyStartMonth);
    } finally {
      setYearlyLoading(false);
    }
  }

  return (
    <div className="view-stack page-stack">
      <section className="page-hero">
        <div className="page-hero-icon">
          <Banknote size={24} />
        </div>
        <div>
          <h2>Pembayaran Kas</h2>
          <p>Catat iuran per bulan atau langsung setahun. Tanggal jatuh tempo tiap tanggal {dueDay}.</p>
        </div>
      </section>

      {/* TAB MODE */}
      <section className="panel" style={{ paddingBottom: 0 }}>
        <div className="segmented-tabs">
          {(['bulanan', 'tahunan'] as PayMode[]).map((m) => (
            <button
              key={m}
              type="button"
              className={`segment${payMode === m ? ' is-active' : ''}`}
              onClick={() => setPayMode(m)}
            >
              {m === 'bulanan' ? 'Bulanan' : `Tahunan (Diskon ${discountPct}%)`}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        {/* SEARCH ANGGOTA — shared untuk kedua mode */}
        <div className="form-stack">
          <label className="field">
            <span className="field-label">Cari anggota</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={16}
                color="var(--text-secondary)"
                style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }}
              />
              <input
                className="text-input"
                style={{ paddingLeft: '40px' }}
                placeholder="Ketik nama anggota..."
                value={searchQuery}
                onChange={(e) => {
                  const q = e.target.value;
                  setSearchQuery(q);
                  if (draft.memberId) {
                    const stillVisible = members.some(
                      (m) => m.id === draft.memberId && m.name.toLowerCase().includes(q.toLowerCase())
                    );
                    if (!stillVisible) onDraftChange({ ...draft, memberId: '', amount: '' });
                  }
                }}
              />
            </div>
          </label>

          <PremiumDropdown
            label="Pilih anggota"
            onChange={(value) => {
              const sel = members.find((m) => m.id === value);
              onDraftChange({
                ...draft,
                memberId: value,
                amount: sel ? formatNumberInput(String(sel.monthlyDue)) : draft.amount,
              });
            }}
            options={memberOptions}
            placeholder={
              members.length === 0
                ? 'Belum ada anggota'
                : filteredMembers.length === 0
                ? 'Nama tidak ditemukan'
                : 'Pilih anggota'
            }
            value={draft.memberId}
            disabled={filteredMembers.length === 0}
          />

          {/* INFO BADGE anggota terpilih */}
          {selectedMember && (() => {
            const isPaid = paidSet.has(selectedMember.id);
            return (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isPaid ? 'var(--success-soft)' : 'var(--accent-soft)',
                  border: `1px solid ${isPaid ? 'var(--success)' : 'var(--accent)'}33`,
                  fontSize: '13px',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>
                  Iuran standar <strong style={{ color: 'var(--text-primary)' }}>{selectedMember.name}</strong>
                </span>
                <span style={{ fontWeight: 700, color: isPaid ? 'var(--success)' : 'var(--accent)' }}>
                  {isPaid ? '✓ Lunas bulan ini' : formatCurrency(selectedMember.monthlyDue) + '/bln'}
                </span>
              </div>
            );
          })()}
        </div>

        {/* ===== FORM BULANAN ===== */}
        {payMode === 'bulanan' && (
          <form className="form-stack" onSubmit={onSubmit} style={{ marginTop: 16 }}>
            <label className="field">
              <span className="field-label">Nominal bayar</span>
              <input
                className="text-input numeric-input"
                inputMode="numeric"
                onChange={(e) => onDraftChange({ ...draft, amount: formatNumberInput(e.target.value) })}
                placeholder="25.000"
                required
                value={draft.amount}
              />
            </label>

            <label className="field">
              <span className="field-label">Tanggal bayar kas (pilih bulan depan jika rapel)</span>
              <input
                className="text-input"
                onChange={(e) => onDraftChange({ ...draft, date: e.target.value })}
                required
                type="date"
                value={draft.date}
              />
            </label>

            <label className="field">
              <span className="field-label">Catatan</span>
              <textarea
                className="text-area"
                maxLength={160}
                onChange={(e) => onDraftChange({ ...draft, note: e.target.value })}
                placeholder="Opsional, misal: pembayaran rapel"
                rows={2}
                value={draft.note}
              />
            </label>

            <button className="primary-button wide" disabled={!members.length} type="submit">
              Simpan Pembayaran Bulanan
            </button>
          </form>
        )}

        {/* ===== FORM TAHUNAN ===== */}
        {payMode === 'tahunan' && (
          <form className="form-stack" onSubmit={handleYearlySubmit} style={{ marginTop: 16 }}>
            {/* Ringkasan kalkulasi diskon */}
            {selectedMember ? (
              <div
                style={{
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--info-soft)',
                  border: '1px solid var(--info)33',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Tag size={14} color="var(--info)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)' }}>
                    Ringkasan Bayar Tahunan
                  </span>
                </div>

                {[
                  { label: 'Iuran bulanan', value: formatCurrency(monthlyAmount) },
                  { label: 'Total normal (12 bln)', value: formatCurrency(normalYearly) },
                  { label: `Diskon ${discountPct}%`, value: `− ${formatCurrency(discountAmount)}`, highlight: true },
                  { label: 'Total yang dibayar', value: formatCurrency(finalYearly), bold: true },
                  ...(discountPct > 0 ? [{ label: 'Hemat per bulan', value: `${formatCurrency(monthlyAmount - perMonthAfterDiscount)} / bulan`, small: true }] : []),
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: row.bold ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: row.bold ? 700 : 400 }}>
                      {row.label}
                    </span>
                    <span style={{ fontSize: row.small ? 12 : 13, fontWeight: row.bold ? 800 : 600, color: row.highlight ? 'var(--success)' : row.bold ? 'var(--info)' : 'var(--text-primary)' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-2)',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                }}
              >
                Pilih anggota di atas untuk melihat kalkulasi tahunan.
              </div>
            )}

            <label className="field">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <CalendarDays size={14} color="var(--text-secondary)" />
                <span className="field-label" style={{ marginBottom: 0 }}>Mulai bulan</span>
              </div>
              <input
                className="text-input"
                type="month"
                value={yearlyStartMonth}
                onChange={(e) => setYearlyStartMonth(e.target.value)}
                required
                min={getCurrentMonthKey()}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>
                Sistem akan mencatat 12 transaksi iuran otomatis mulai dari bulan ini.
              </small>
            </label>

            <button
              className="primary-button wide"
              disabled={!selectedMember || yearlyLoading || !onSubmitYearly}
              type="submit"
            >
              {yearlyLoading ? 'Menyimpan 12 bulan...' : `Simpan Pembayaran Tahunan − ${formatCurrency(finalYearly)}`}
            </button>
          </form>
        )}
      </section>

      {/* DAFTAR BELUM BAYAR BULAN INI */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Belum Bayar Bulan Ini</h3>
            <p>Prioritas penagihan kas berjalan.</p>
          </div>
          {unpaidMembers.length > 0 && (
            <span className="pill warning">{unpaidMembers.length} anggota</span>
          )}
        </div>
        {unpaidMembers.length ? (
          <div className="list-stack">
            {unpaidMembers.map((member) => (
              <article
                className="list-row"
                key={member.id}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onDraftChange({
                    ...draft,
                    memberId: member.id,
                    amount: formatNumberInput(String(member.monthlyDue)),
                  });
                  setSearchQuery('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
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
              <CircleAlert size={24} />
            </div>
            <strong>Tidak ada tunggakan.</strong>
            <p>Semua anggota sudah tercatat membayar bulan ini.</p>
          </div>
        )}
      </section>
    </div>
  );
}
