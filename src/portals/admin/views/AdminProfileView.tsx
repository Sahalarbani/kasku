import { LogOut, Moon, SunMedium, UserRound } from 'lucide-react';
import { auth } from '../../../shared/services/auth';
import type { Member, ThemeMode } from '../../../shared/types';
import { UsersView } from './UsersView';
import { useAppSetting } from '../../../shared/services/firebase';

type Props = {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onToast: (message: string, type: 'success' | 'error') => void;
  members: Member[];
};

export function AdminProfileView({ theme, onToggleTheme, onToast, members }: Props) {
  const user = auth.currentUser;
  const { value: defaultDue, setValue: setDefaultDue } = useAppSetting('defaultDue', '25.000');
  const { value: dueDay, setValue: setDueDay } = useAppSetting('dueDay', '10');
  const { value: yearlyDiscountPct, setValue: setYearlyDiscountPct } = useAppSetting('yearlyDiscountPct', '10');

  return (
    <div className="view-stack page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Profil Admin</h3>
            <p>Kelola sesi, tema, dan akses pengguna.</p>
          </div>
          <div className="empty-state-icon" style={{ width: 44, height: 44, margin: 0 }}>
            <UserRound size={22} />
          </div>
        </div>

        <article className="list-row">
          <div>
            <strong>{user?.displayName || user?.email || 'Admin Kasku'}</strong>
            <small>{user?.email || 'Email tidak tersedia'}</small>
          </div>
          <span className="pill success">Admin</span>
        </article>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
          <button className="secondary-button wide" type="button" onClick={onToggleTheme}>
            {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Terang' : 'Gelap'}
          </button>
          <button className="secondary-button wide" type="button" onClick={() => auth.signOut()} style={{ color: 'var(--danger)' }}>
            <LogOut size={18} />
            Keluar
          </button>
        </div>

        <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div className="panel-heading" style={{ padding: 0, marginBottom: 12 }}>
            <div>
              <h3>Setelan Iuran Bulanan</h3>
              <p>Atur nominal default, tanggal tagihan, dan diskon tahunan.</p>
            </div>
          </div>

          <label className="field">
            <span className="field-label">Setelan Nominal Iuran Standar (Rp)</span>
            <input 
              className="text-input numeric-input" 
              inputMode="numeric"
              value={defaultDue}
              onChange={(e) => setDefaultDue(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
              onBlur={(e) => {
                 let val = e.target.value.replace(/\D/g, '');
                 if(!val) val = '25000';
                 setDefaultDue(Number(val).toLocaleString('id-ID'));
                 onToast('Setelan iuran standar disimpan ke cloud.', 'success');
              }}
            />
            <small style={{color:'var(--text-secondary)', fontSize: 12, marginTop: 4}}>Berlaku saat menambahkan anggota baru.</small>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label className="field">
              <span className="field-label">Tanggal Jatuh Tempo</span>
              <input
                className="text-input numeric-input"
                inputMode="numeric"
                min={1}
                max={31}
                type="number"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value.replace(/\D/g, ''))}
                onBlur={(e) => {
                  let val = Number(e.target.value || 10);
                  val = Math.min(Math.max(val, 1), 31);
                  setDueDay(String(val));
                  onToast(`Tanggal jatuh tempo disimpan: tiap tanggal ${val}.`, 'success');
                }}
              />
              <small style={{color:'var(--text-secondary)', fontSize: 12, marginTop: 4}}>Contoh: 10 berarti tagihan tiap tanggal 10.</small>
            </label>

            <label className="field">
              <span className="field-label">Diskon Tahunan (%)</span>
              <input
                className="text-input numeric-input"
                inputMode="numeric"
                min={0}
                max={100}
                type="number"
                value={yearlyDiscountPct}
                onChange={(e) => setYearlyDiscountPct(e.target.value.replace(/\D/g, ''))}
                onBlur={(e) => {
                  let val = Number(e.target.value || 0);
                  val = Math.min(Math.max(val, 0), 100);
                  setYearlyDiscountPct(String(val));
                  onToast(`Diskon bayar tahunan disimpan: ${val}%.`, 'success');
                }}
              />
              <small style={{color:'var(--text-secondary)', fontSize: 12, marginTop: 4}}>Dipakai saat warga pilih bayar 1 tahun.</small>
            </label>
          </div>
        </div>
      </section>

      <UsersView onToast={onToast} members={members} />
    </div>
  );
}
