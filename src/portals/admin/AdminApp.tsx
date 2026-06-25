/* v8.0.0 | Premium solid tokens, zero gradient, strict native shell */
import { ArrowDownUp, Banknote, BellDot, LayoutGrid, UserRound, Users } from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { PremiumDropdown } from '../../shared/components/ui/PremiumDropdown';
import { Sheet } from '../../shared/components/ui/Sheet';
import { computeSnapshot, formatNumberInput, getCurrentMonthKey, sortByNewest } from '../../shared/services/finance';
import { useFirebaseData, addMemberToDb, addTransactionToDb, batchImportData, addYearlyTransactions } from '../../shared/services/firebase';
import { sendNotification } from '../../shared/services/notifier';
import type { Member, ThemeMode, Transaction, TransactionCategory, TransactionType } from '../../shared/types/index';
import { DashboardView } from './views/DashboardView';
import { MembersView } from './views/MembersView';
import { PaymentsView } from './views/PaymentsView';
import { TransactionsView } from './views/TransactionsView';
import { AdminProfileView } from './views/AdminProfileView';
import { RequestsView } from './views/RequestsView';

const transactionCategoryOptions: Record<TransactionType, { value: TransactionCategory; label: string; meta: string }[]> = {
  income: [
    { value: 'sumbangan', label: 'Sumbangan', meta: 'Donasi dari warga atau sponsor' },
    { value: 'kegiatan', label: 'Hasil kegiatan', meta: 'Pemasukan dari event atau bazar' },
    { value: 'lainnya', label: 'Lainnya', meta: 'Pemasukan non-rutin lainnya' },
  ],
  expense: [
    { value: 'operasional', label: 'Operasional', meta: 'Rapat, konsumsi, transport' },
    { value: 'perlengkapan', label: 'Perlengkapan', meta: 'Pembelian alat dan bahan' },
    { value: 'kegiatan', label: 'Kegiatan', meta: 'Biaya pelaksanaan kegiatan' },
    { value: 'lainnya', label: 'Lainnya', meta: 'Pengeluaran non-rutin lainnya' },
  ],
};

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function parseFormattedNumber(value: string) {
  return Number(value.replace(/[^0-9]/g, ''));
}

function validatePhone(phone: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return 'Nomor HP harus 9-15 digit angka.';
  if (!digits.startsWith('0') && !digits.startsWith('62') && !digits.startsWith('8')) {
    return 'Format nomor HP tidak valid. Contoh: 08123456789';
  }
  return null;
}

function downloadJson(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `kasku-backup-${todayValue()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function AppLayout({
  theme,
  toast,
  children,
}: {
  theme: ThemeMode;
  toast: { message: string; type: 'success' | 'error' } | null;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell" data-theme={theme}>
      <main className="content-scroll">{children}</main>

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.message}</div>
        </div>
      )}

      <nav className="bottom-bar" aria-label="Navigasi admin">
        <NavLink className={({ isActive }) => `tab-button${isActive ? ' is-active' : ''}`} to="/" end>
          <LayoutGrid size={20} /><span>Beranda</span>
        </NavLink>
        <NavLink className={({ isActive }) => `tab-button${isActive ? ' is-active' : ''}`} to="/pembayaran">
          <Banknote size={20} /><span>Bayar</span>
        </NavLink>
        <NavLink className={({ isActive }) => `tab-button${isActive ? ' is-active' : ''}`} to="/transaksi">
          <ArrowDownUp size={20} /><span>Transaksi</span>
        </NavLink>
        <NavLink className={({ isActive }) => `tab-button${isActive ? ' is-active' : ''}`} to="/anggota">
          <Users size={20} /><span>Anggota</span>
        </NavLink>
        <NavLink className={({ isActive }) => `tab-button${isActive ? ' is-active' : ''}`} to="/notifikasi">
          <BellDot size={20} /><span>Notif</span>
        </NavLink>
        <NavLink className={({ isActive }) => `tab-button${isActive ? ' is-active' : ''}`} to="/profil">
          <UserRound size={20} /><span>Profil</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default function AdminApp() {
  const navigate = useNavigate();

  // Default tema TERANG
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (window.localStorage.getItem('kasku-theme') as ThemeMode) || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    window.localStorage.setItem('kasku-theme', theme);
  }, [theme]);

  const { members, transactions, loading } = useFirebaseData();
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [memberSheetOpen, setMemberSheetOpen] = useState(false);
  const [transactionSheetOpen, setTransactionSheetOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimeout = useRef<number | undefined>(undefined);
  const importRef = useRef<HTMLInputElement>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToast(null), 3500);
  }

  const [memberDraft, setMemberDraft] = useState({
    name: '',
    phone: '',
    address: '',
    monthlyDue: window.localStorage.getItem('kasku-default-due') || '25.000',
  });

  const [paymentDraft, setPaymentDraft] = useState({
    memberId: '',
    amount: '',
    date: todayValue(),
    note: '',
  });

  const [transactionDraft, setTransactionDraft] = useState({
    type: 'income' as TransactionType,
    category: transactionCategoryOptions.income[0].value,
    amount: '',
    date: todayValue(),
    note: '',
  });

  const orderedTransactions = useMemo(() => sortByNewest(transactions), [transactions]);
  const snapshot = useMemo(
    () => computeSnapshot(members, orderedTransactions, getCurrentMonthKey()),
    [members, orderedTransactions],
  );

  function resetTransactionDraft(nextType: TransactionType = 'income') {
    setTransactionDraft({
      type: nextType,
      category: transactionCategoryOptions[nextType][0].value,
      amount: '',
      date: todayValue(),
      note: '',
    });
  }

  function resetPaymentDraft() {
    const first = members[0];
    setPaymentDraft({
      memberId: first?.id ?? '',
      amount: first ? formatNumberInput(String(first.monthlyDue)) : '',
      date: todayValue(),
      note: '',
    });
  }

  async function handleAddMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = parseFormattedNumber(memberDraft.monthlyDue);
    const name = memberDraft.name.trim();
    const phone = memberDraft.phone.trim();
    const address = memberDraft.address.trim();

    // Validasi nama
    if (name.length < 3) return showToast('Nama anggota minimal 3 huruf.', 'error');
    if (!/^[a-zA-Z\s'.,-]+$/.test(name)) return showToast('Nama hanya boleh huruf dan karakter nama umum.', 'error');

    // Cek duplikat nama (case-insensitive)
    const isDuplicate = members.some(
      (m) => m.name.toLowerCase().trim() === name.toLowerCase()
    );
    if (isDuplicate) return showToast(`Anggota "${name}" sudah terdaftar.`, 'error');

    // Validasi nomor HP
    const phoneError = validatePhone(phone);
    if (phoneError) return showToast(phoneError, 'error');

    // Validasi iuran
    if (amount < 1000) return showToast('Iuran bulanan minimal Rp1.000.', 'error');
    if (amount > 10_000_000) return showToast('Iuran bulanan terlalu besar. Periksa kembali.', 'error');

    try {
      await addMemberToDb({ name, phone, address, monthlyDue: amount });
      setMemberDraft({ name: '', phone: '', address: '', monthlyDue: window.localStorage.getItem('kasku-default-due') || '25.000' });
      setMemberSheetOpen(false);
      showToast(`${name} berhasil ditambahkan.`);
      resetPaymentDraft();
    } catch {
      showToast('Gagal menyimpan. Periksa koneksi internet Anda.', 'error');
    }
  }

  async function handleAddPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = parseFormattedNumber(paymentDraft.amount);
    const selectedMember = members.find((m) => m.id === paymentDraft.memberId);

    if (!selectedMember) return showToast('Pilih anggota terlebih dahulu.', 'error');
    if (amount <= 0) return showToast('Nominal pembayaran tidak valid.', 'error');
    if (amount > 10_000_000) return showToast('Nominal terlalu besar. Periksa kembali.', 'error');
    if (!paymentDraft.date) return showToast('Tanggal pembayaran wajib diisi.', 'error');

    // Blokir jika mencoba bayar untuk bulan yang sama yang sudah lunas
    // Pembayaran ini direkam dengan tanggal paymentDraft.date. Jika bulan dari paymentDraft.date
    // sama dengan bulan berjalan (snapshot month) dan member itu lunas, blokir.
    const isAlreadyPaid = paymentDraft.date.slice(0, 7) === getCurrentMonthKey() && snapshot.paidMemberIds.includes(selectedMember.id);
    if (isAlreadyPaid) {
      return showToast(`${selectedMember.name} sudah tercatat LUNAS untuk bulan ini. Pembayaran ditolak. Jika ini adalah tunggakan bulan sebelumnya atau rapel bulan depan, pastikan Anda mengubah "Tanggal bayar" ke bulan yang benar.`, 'error');
    }

    try {
      await addTransactionToDb({
        type: 'income',
        category: 'iuran',
        amount,
        date: paymentDraft.date,
        note: paymentDraft.note.trim() || `Pembayaran iuran ${selectedMember.name}`,
        memberId: selectedMember.id,
      });
      resetPaymentDraft();
      showToast(`Iuran ${selectedMember.name} berhasil disimpan.`);
      sendNotification('Iuran Diterima', `${selectedMember.name} membayar iuran Rp${amount.toLocaleString('id-ID')}.`);
      navigate('/');
    } catch {
      showToast('Gagal menyimpan pembayaran. Periksa koneksi.', 'error');
    }
  }

  async function handleAddTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = parseFormattedNumber(transactionDraft.amount);

    if (amount <= 0) return showToast('Nominal transaksi tidak valid.', 'error');
    if (amount > 100_000_000) return showToast('Nominal terlalu besar. Periksa kembali.', 'error');
    if (!transactionDraft.date) return showToast('Tanggal transaksi wajib diisi.', 'error');

    const dateObj = new Date(transactionDraft.date);
    if (isNaN(dateObj.getTime())) return showToast('Format tanggal tidak valid.', 'error');
    if (dateObj > new Date()) return showToast('Tanggal tidak boleh di masa depan.', 'error');

    if (transactionDraft.type === 'expense') {
      if (!transactionDraft.note.trim()) {
        return showToast('Keterangan wajib diisi untuk pengeluaran.', 'error');
      }
      if (amount > snapshot.balance) {
        return showToast(`Saldo tidak cukup! Saldo saat ini hanya Rp${snapshot.balance.toLocaleString('id-ID')}`, 'error');
      }
    }

    try {
      await addTransactionToDb({
        type: transactionDraft.type,
        category: transactionDraft.category,
        amount,
        date: transactionDraft.date,
        note: transactionDraft.note.trim(),
        memberId: null,
      });
      setTransactionSheetOpen(false);
      resetTransactionDraft(transactionDraft.type);
      showToast('Transaksi berhasil disimpan.');
      sendNotification(
        transactionDraft.type === 'income' ? 'Pemasukan Kas' : 'Pengeluaran Kas',
        `Rp${amount.toLocaleString('id-ID')} - ${transactionDraft.note.trim() || transactionDraft.category}`
      );
    } catch {
      showToast('Gagal mencatat transaksi. Periksa koneksi.', 'error');
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      return showToast('File harus berformat .json', 'error');
    }
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as { members?: Member[]; transactions?: Transaction[] };
      if (!parsed.members && !parsed.transactions) {
        return showToast('Format file JSON tidak dikenali.', 'error');
      }
      await batchImportData(parsed.members || [], parsed.transactions || []);
      showToast('Backup berhasil diimpor ke cloud!');
    } catch {
      showToast('File JSON rusak atau tidak valid.', 'error');
    } finally {
      event.target.value = '';
    }
  }

  function handleExport() {
    downloadJson({ members, transactions, exportedAt: new Date().toISOString() });
    showToast('File backup berhasil diunduh.');
  }

  async function handleAddYearly(memberId: string, memberName: string, monthlyAmount: number, startMonth: string) {
    try {
      await addYearlyTransactions(memberId, memberName, monthlyAmount, startMonth);
      resetPaymentDraft();
      showToast(`Iuran tahunan ${memberName} berhasil disimpan!`);
      sendNotification('Pembayaran Tahunan', `${memberName} melunasi iuran tahunan penuh.`);
      navigate('/');
    } catch {
      showToast('Gagal memproses pembayaran tahunan. Periksa koneksi.', 'error');
    }
  }

  // --- RENDERING ---

  if (loading) {
    return (
      <div className="app-shell" data-theme={theme} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '64px', opacity: 0.6, fontSize: '14px', textAlign: 'center' }}>
          Menyinkronkan data...
        </div>
      </div>
    );
  }

  return (
    <>
      <AppLayout theme={theme} toast={toast}>
        <Routes>
          <Route path="/" element={
            <DashboardView
              members={members}
              onExport={handleExport}
              onImportClick={() => importRef.current?.click()}
              snapshot={snapshot}
              transactions={orderedTransactions}
            />
          } />
          <Route path="/pembayaran" element={
            <PaymentsView
              draft={paymentDraft}
              members={members}
              onDraftChange={setPaymentDraft}
              onSubmit={handleAddPayment}
              onSubmitYearly={handleAddYearly}
              paidMemberIds={snapshot.paidMemberIds}
            />
          } />
          <Route path="/transaksi" element={
            <TransactionsView
              filter={transactionFilter}
              members={members}
              onCreate={() => { resetTransactionDraft('income'); setTransactionSheetOpen(true); }}
              onFilterChange={setTransactionFilter}
              transactions={orderedTransactions}
              onToast={showToast}
            />
          } />
          <Route path="/anggota" element={
            <MembersView
              members={members}
              onCreate={() => setMemberSheetOpen(true)}
              paidMemberIds={snapshot.paidMemberIds}
              onToast={showToast}
            />
          } />
          <Route path="/notifikasi" element={<RequestsView onToast={showToast} />} />
          <Route path="/profil" element={
            <AdminProfileView
              theme={theme}
              onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              onToast={showToast}
              members={members}
            />
          } />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </AppLayout>

      {/* Sheet Tambah Anggota */}
      <Sheet
        open={memberSheetOpen}
        onClose={() => setMemberSheetOpen(false)}
        subtitle="Isi data lengkap anggota. Nama tidak boleh duplikat."
        title="Tambah Anggota"
      >
        <form className="form-stack" onSubmit={handleAddMember}>
          <label className="field">
            <span className="field-label">Nama Lengkap *</span>
            <input
              className="text-input"
              maxLength={80}
              onChange={(e) => setMemberDraft((c) => ({ ...c, name: e.target.value }))}
              placeholder="Contoh: Rudi Saputra"
              required
              value={memberDraft.name}
            />
          </label>
          <label className="field">
            <span className="field-label">Nomor HP</span>
            <input
              className="text-input"
              inputMode="tel"
              maxLength={16}
              onChange={(e) => setMemberDraft((c) => ({ ...c, phone: e.target.value }))}
              placeholder="08xxxxxxxxxx"
              value={memberDraft.phone}
            />
          </label>
          <label className="field">
            <span className="field-label">Alamat Singkat</span>
            <textarea
              className="text-area"
              maxLength={160}
              onChange={(e) => setMemberDraft((c) => ({ ...c, address: e.target.value }))}
              placeholder="RT / patokan rumah"
              rows={2}
              value={memberDraft.address}
            />
          </label>
          <label className="field">
            <span className="field-label">Iuran Bulanan *</span>
            <input
              className="text-input numeric-input"
              inputMode="numeric"
              onChange={(e) => setMemberDraft((c) => ({ ...c, monthlyDue: formatNumberInput(e.target.value) }))}
              placeholder={window.localStorage.getItem('kasku-default-due') || '25.000'}
              required
              value={memberDraft.monthlyDue}
            />
          </label>
          <button className="primary-button wide" type="submit">Simpan Anggota</button>
        </form>
      </Sheet>

      {/* Sheet Catat Transaksi */}
      <Sheet
        open={transactionSheetOpen}
        onClose={() => setTransactionSheetOpen(false)}
        subtitle="Pemasukan non-kas dan pengeluaran operasional."
        title="Catat Transaksi"
      >
        <form className="form-stack" onSubmit={handleAddTransaction}>
          <div className="field">
            <span className="field-label">Jenis Transaksi</span>
            <div className="segmented-tabs">
              {([
                { value: 'income', label: 'Pemasukan' },
                { value: 'expense', label: 'Pengeluaran' },
              ] as { value: TransactionType; label: string }[]).map((opt) => (
                <button
                  className={`segment${transactionDraft.type === opt.value ? ' is-active' : ''}`}
                  key={opt.value}
                  onClick={() => {
                    const next = opt.value;
                    setTransactionDraft((c) => ({
                      ...c, type: next,
                      category: transactionCategoryOptions[next][0].value,
                    }));
                  }}
                  type="button"
                >{opt.label}</button>
              ))}
            </div>
          </div>
          <PremiumDropdown
            label="Kategori"
            onChange={(v) => setTransactionDraft((c) => ({ ...c, category: v as TransactionCategory }))}
            options={transactionCategoryOptions[transactionDraft.type]}
            value={transactionDraft.category}
          />
          <label className="field">
            <span className="field-label">Nominal *</span>
            <input
              className="text-input numeric-input"
              inputMode="numeric"
              onChange={(e) => setTransactionDraft((c) => ({ ...c, amount: formatNumberInput(e.target.value) }))}
              placeholder="50.000"
              required
              value={transactionDraft.amount}
            />
          </label>
          <label className="field">
            <span className="field-label">Tanggal *</span>
            <input
              className="text-input"
              onChange={(e) => setTransactionDraft((c) => ({ ...c, date: e.target.value }))}
              required
              type="date"
              value={transactionDraft.date}
            />
          </label>
          <label className="field">
            <span className="field-label">
              Keterangan{transactionDraft.type === 'expense' ? ' *' : ''}
            </span>
            <textarea
              className="text-area"
              maxLength={160}
              onChange={(e) => setTransactionDraft((c) => ({ ...c, note: e.target.value }))}
              placeholder={transactionDraft.type === 'expense' ? 'Wajib diisi untuk pengeluaran' : 'Opsional'}
              rows={2}
              value={transactionDraft.note}
            />
          </label>
          <button className="primary-button wide" type="submit">Simpan Transaksi</button>
        </form>
      </Sheet>

      <input accept="application/json" className="hidden-input" onChange={handleImport} ref={importRef} type="file" />
    </>
  );
}
