import { Plus, Trash2, UsersRound } from 'lucide-react';
import { formatCurrency } from '../../../shared/services/finance';
import { deleteMemberFromDb } from '../../../shared/services/firebase';
import type { Member } from '../../../shared/types/index';

type Props = {
  members: Member[];
  paidMemberIds: string[];
  onCreate: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
};

export function MembersView({ members, paidMemberIds, onCreate, onToast }: Props) {
  const paidSet = new Set(paidMemberIds);

  async function handleDelete(member: Member) {
    if (!confirm(`Hapus anggota "${member.name}"? Data tidak bisa dikembalikan.`)) return;
    try {
      await deleteMemberFromDb(member.id);
      onToast(`${member.name} berhasil dihapus.`, 'success');
    } catch {
      onToast('Gagal menghapus anggota.', 'error');
    }
  }

  return (
    <div className="view-stack page-stack">
      <section className="panel compact-gap">
        <div className="panel-heading">
          <div>
            <h3>Daftar Anggota</h3>
            <p>Kelola data anggota dan status iuran bulan berjalan.</p>
          </div>
          <button className="primary-button" onClick={onCreate} type="button">
            <Plus size={16} />
            Tambah
          </button>
        </div>
      </section>

      <section className="panel">
        {members.length ? (
          <div className="list-stack">
            {members.map((member) => {
              const paid = paidSet.has(member.id);
              return (
                <article className="list-row tall" key={member.id}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{member.name}</strong>
                    <small>
                      {member.phone || 'Tanpa nomor'}
                      {member.address ? ` · ${member.address}` : ''}
                    </small>
                  </div>
                  <div className="row-actions">
                    <span className="pill neutral">{formatCurrency(member.monthlyDue)}</span>
                    <span className={`pill ${paid ? 'success' : 'warning'}`}>{paid ? 'Lunas' : 'Belum'}</span>
                    <button
                      type="button"
                      className="icon-button"
                      style={{ color: 'var(--danger)', background: 'var(--danger-soft)', minHeight: 36, width: 36 }}
                      onClick={() => handleDelete(member)}
                      aria-label="Hapus anggota"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><UsersRound size={24} /></div>
            <strong>Belum ada anggota.</strong>
            <p>Tambahkan data anggota agar iuran bulanan bisa mulai dicatat.</p>
          </div>
        )}
      </section>
    </div>
  );
}
