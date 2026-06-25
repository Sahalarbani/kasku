import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import { useUsersData, updateUserRole } from '../../../shared/services/firebase';
import { SegmentedTabs } from '../../../shared/components/ui/SegmentedTabs';
import type { Member, UserDoc, UserRole } from '../../../shared/types';

type Props = {
  onToast: (message: string, type: 'success' | 'error') => void;
  members: Member[];
};

const roleLabelMap: Record<UserRole, string> = {
  pending: 'Pending',
  warga: 'Warga',
  admin: 'Admin',
  rt: 'RT',
  developer: 'Developer',
};

const roleColorMap: Record<UserRole, string> = {
  pending: 'warning',
  warga: 'neutral',
  admin: 'success',
  rt: 'success',
  developer: 'danger',
};

export function UsersView({ onToast, members }: Props) {
  const { users, loading } = useUsersData();
  const [filter, setFilter] = useState('pending');

  const filtered = users.filter((u) => {
    if (filter === 'pending') return u.role === 'pending';
    if (filter === 'active') return u.role !== 'pending';
    return true;
  });

  async function handleSetRole(user: UserDoc, newRole: UserRole) {
    const label = roleLabelMap[newRole];
    if (!confirm(`Ubah role ${user.name} menjadi ${label}?`)) return;
    try {
      await updateUserRole(user.uid, newRole, user, members);
      onToast(`${user.name} disetujui sebagai ${label}.`, 'success');
    } catch {
      onToast('Gagal mengubah role.', 'error');
    }
  }

  if (loading) {
    return <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.6, fontSize: '14px' }}>Memuat data akun...</div>;
  }

  return (
    <>
      <section className="panel compact-gap">
        <div className="panel-heading">
          <div>
            <h3>Kelola Pendaftar</h3>
            <p>Setujui akun baru dan ubah role pengguna.</p>
          </div>
        </div>
        <SegmentedTabs
          onChange={setFilter}
          options={[
            { value: 'pending', label: `Menunggu (${users.filter(u => u.role === 'pending').length})` },
            { value: 'active', label: 'Aktif' },
            { value: 'all', label: 'Semua' },
          ]}
          value={filter}
        />
      </section>

      <section className="panel">
        {filtered.length > 0 ? (
          <div className="list-stack">
            {filtered.map((user) => (
              <article className="list-row tall" key={user.uid}>
                <div>
                  <strong>{user.name}</strong>
                  <small>{user.phone || 'Tanpa HP'} · {user.role}</small>
                </div>
                <div className="row-actions">
                  {user.role === 'pending' ? (
                    <>
                      <button className="pill success" style={{ cursor: 'pointer', border: 'none' }} onClick={() => handleSetRole(user, 'warga')}>
                        Warga
                      </button>
                      <button className="pill" style={{ cursor: 'pointer', border: 'none', background: 'var(--info-soft)', color: 'var(--info)' }} onClick={() => handleSetRole(user, 'admin')}>
                        Admin
                      </button>
                    </>
                  ) : (
                    <span className={`pill ${roleColorMap[user.role]}`}>{roleLabelMap[user.role]}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              {filter === 'pending' ? <Clock size={24} /> : <ShieldCheck size={24} />}
            </div>
            <strong>{filter === 'pending' ? 'Tidak ada antrian.' : 'Belum ada user.'}</strong>
            <p>{filter === 'pending' ? 'Semua pendaftar telah disetujui.' : 'Belum ada akun terdaftar.'}</p>
          </div>
        )}
      </section>
    </>
  );
}
