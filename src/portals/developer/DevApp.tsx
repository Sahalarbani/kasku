/* v5.0.0 | DevApp premium dark native shell */
import { TerminalSquare, LogOut, LayoutDashboard, ArrowRightCircle, Trash2 } from 'lucide-react';
import { useAppLogs, useUsersData, useFirebaseData, updateUserRole, deleteUserDoc } from '../../shared/services/firebase';
import { auth } from '../../shared/services/auth';
import type { UserDoc, UserRole } from '../../shared/types';
import { useState } from 'react';
import { SegmentedTabs } from '../../shared/components/ui/SegmentedTabs';

export default function DevApp({ roleDoc, setRoleOverride }: { roleDoc: UserDoc, setRoleOverride: (r: string | null) => void }) {
  const { logs, loading: logsLoading } = useAppLogs();
  const { users, loading: usersLoading } = useUsersData();
  const { members } = useFirebaseData();
  const [tab, setTab] = useState('logs');

  async function handleDeleteUser(u: UserDoc) {
    if (!confirm(`Hapus akun login ${u.name}?`)) return;
    try {
      await deleteUserDoc(u.uid);
    } catch {
      alert('Gagal menghapus user');
    }
  }

  async function handleSetRole(u: UserDoc, r: UserRole) {
    if (!confirm(`Jadikan ${u.name} sebagai ${r}?`)) return;
    try {
      await updateUserRole(u.uid, r, u, members);
    } catch {
      alert('Gagal set role');
    }
  }

  return (
    <div className="app-shell" data-theme="dark">
      <main className="content-scroll">
        <div className="view-stack page-stack">
          <section className="panel" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="panel-heading" style={{ marginBottom: 0 }}>
              <div>
                <h3 style={{ color: 'var(--success)' }}>Developer Console</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Root Access | {roleDoc.name}</p>
              </div>
              <TerminalSquare size={24} color="var(--success)" />
            </div>
          </section>

          <SegmentedTabs
            onChange={setTab}
            options={[
              { value: 'logs', label: 'Logs' },
              { value: 'users', label: 'Akun' },
              { value: 'tools', label: 'Bypass' }
            ]}
            value={tab}
          />

          {tab === 'tools' && (
            <section className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, marginBottom: 16 }}>Portal Testing</h3>
              <div className="form-stack">
                <button className="secondary-button wide" onClick={() => setRoleOverride('admin')}>
                  <LayoutDashboard size={18} /> Masuk sebagai Admin
                </button>
                <button className="secondary-button wide" onClick={() => setRoleOverride('warga')}>
                  <ArrowRightCircle size={18} /> Masuk sebagai Warga
                </button>
                <button className="primary-button wide" onClick={() => auth.signOut()} style={{ background: 'var(--danger)', color: '#fff', marginTop: 16 }}>
                  <LogOut size={18} /> Logout Root
                </button>
              </div>
            </section>
          )}

          {tab === 'users' && (
            <section className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, marginBottom: 16 }}>Manajemen Akun Login</h3>
              {usersLoading ? <div style={{ color: 'var(--success)', textAlign: 'center' }}>Memuat akun...</div> : (
                <div className="list-stack" style={{ gap: 8 }}>
                  {users.map((u) => (
                    <article key={u.uid} style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{u.name}</strong>
                          <small style={{ color: 'var(--text-secondary)' }}>{u.phone || 'No HP'} · Role: {u.role}</small>
                        </div>
                        <button className="icon-button" style={{ width: 32, height: 32, minHeight: 32, background: 'var(--danger-soft)', color: 'var(--danger)' }} onClick={() => handleDeleteUser(u)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        {u.role !== 'admin' && <button className="secondary-button" style={{ padding: '0 12px', minHeight: 28, fontSize: 12, background: 'var(--surface)', color: 'var(--text-primary)' }} onClick={() => handleSetRole(u, 'admin')}>Jadikan Admin</button>}
                        {u.role !== 'warga' && <button className="secondary-button" style={{ padding: '0 12px', minHeight: 28, fontSize: 12, background: 'var(--surface)', color: 'var(--text-primary)' }} onClick={() => handleSetRole(u, 'warga')}>Jadikan Warga</button>}
                        {u.role !== 'developer' && <button className="secondary-button" style={{ padding: '0 12px', minHeight: 28, fontSize: 12, background: 'var(--surface)', color: 'var(--text-primary)' }} onClick={() => handleSetRole(u, 'developer')}>Jadikan Dev</button>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'logs' && (
            <section className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, marginBottom: 16 }}>Sistem Audit Trail</h3>
              {logsLoading ? <div style={{ color: 'var(--success)', textAlign: 'center' }}>Memuat logs...</div> : (
                <div className="list-stack" style={{ gap: 8 }}>
                  {logs.map((log) => (
                    <article key={log.id} style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ color: 'var(--info)', fontSize: 12 }}>{log.action}</strong>
                        <small style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                          {new Date(log.createdAt).toLocaleString('id-ID', { hour12: false, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </small>
                      </div>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.4 }}>{log.message}</p>
                      <small style={{ color: 'var(--text-secondary)', fontSize: 10, marginTop: 4 }}>UID: {log.uid}</small>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      </main>
    </div>
  );
}