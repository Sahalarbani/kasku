/* v3.0.0 | Root Auth Gateway with premium solid shell */
import { useEffect, useState } from 'react';
import { subscribeAuth, auth, registerWithEmail, loginWithGoogle, updateUserProfile } from './shared/services/auth';
import type { UserDoc } from './shared/types';
import { sendNotification } from './shared/services/notifier';
import AdminApp from './portals/admin/AdminApp';
import WargaApp from './portals/warga/WargaApp';
import DevApp from './portals/developer/DevApp';
import { signInWithEmailAndPassword } from 'firebase/auth';

function AuthView() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Nama wajib diisi.');
        if (password.length < 6) throw new Error('Password minimal 6 karakter.');
        await registerWithEmail(email, password, name, phone);
        sendNotification('Pendaftar Baru', `${name} mendaftar dan menunggu persetujuan.`);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message ? err.message.replace('Firebase:', '') : 'Otentikasi gagal. Periksa input Anda.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch {
      setError('Login Google gagal atau dibatalkan.');
      setLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '400px', margin: 0 }}>
        <div className="panel-heading" style={{ textAlign: 'center', flexDirection: 'column', gap: '8px' }}>
          <h3>{isRegister ? 'Daftar Kasku' : 'Masuk Kasku'}</h3>
          <p>{isRegister ? 'Buat akun untuk akses portal' : 'Masuk untuk mengelola kas'}</p>
        </div>

        <form className="form-stack" onSubmit={handleEmailAuth}>
          {error && <div className="pill danger" style={{ textAlign: 'center', padding: '8px' }}>{error}</div>}

          {isRegister && (
            <>
              <label className="field">
                <span className="field-label">Nama Lengkap</span>
                <input className="text-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Rudi" />
              </label>
              <label className="field">
                <span className="field-label">Nomor WhatsApp</span>
                <input className="text-input" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
              </label>
            </>
          )}

          <label className="field">
            <span className="field-label">Email</span>
            <input className="text-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@kasku.id" />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input className="text-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 karakter" />
          </label>

          <button className="primary-button wide" type="submit" disabled={loading}>
            {loading ? 'Memproses...' : (isRegister ? 'Buat Akun' : 'Masuk')}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '12px' }}>ATAU</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <button className="secondary-button wide" type="button" onClick={handleGoogleLogin} disabled={loading}>
            Masuk dengan Google
          </button>

          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600, padding: '8px' }}
          >
            {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompleteProfileView({ roleDoc }: { roleDoc: UserDoc }) {
  const [name, setName] = useState(roleDoc.name === 'Google User' || roleDoc.name === 'User' ? '' : roleDoc.name);
  const [phone, setPhone] = useState(roleDoc.phone || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return alert('Nama wajib diisi');
    if (!phone.trim()) return alert('Nomor WhatsApp wajib diisi');
    setLoading(true);
    try {
      await updateUserProfile(roleDoc.uid, name, phone);
      sendNotification('Pendaftar Baru', `${name} mendaftar via Google dan menunggu persetujuan.`);
      window.location.reload();
    } catch {
      alert('Gagal menyimpan profil');
      setLoading(false);
    }
  }

  return (
    <div className="app-shell" style={{ padding: '20px', alignItems: 'center', justifyContent: 'center' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '400px', margin: 0 }}>
        <div className="panel-heading" style={{ textAlign: 'center', flexDirection: 'column' }}>
          <h3>Lengkapi Profil</h3>
          <p>Masukkan nama asli dan WhatsApp agar admin bisa mengenali Anda.</p>
        </div>
        <form className="form-stack" onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <label className="field">
            <span className="field-label">Nama Asli</span>
            <input className="text-input" required value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Budi Santoso" />
          </label>
          <label className="field">
            <span className="field-label">Nomor WhatsApp</span>
            <input className="text-input" type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
          </label>
          <button className="primary-button wide" type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan dan Lanjut'}</button>
        </form>
      </div>
    </div>
  );
}

function UnauthorizedView({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div className="empty-state">
        <strong>Akses Ditolak</strong>
        <p>Akun ini tidak memiliki role yang valid di sistem Kasku.</p>
        <button className="secondary-button" onClick={onLogout} style={{ marginTop: '20px' }}>Keluar</button>
      </div>
    </div>
  );
}

export default function RootApp() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [roleDoc, setRoleDoc] = useState<UserDoc | null>(null);
  const [roleOverride, setRoleOverride] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeAuth((firebaseUser, doc) => {
      setUser(firebaseUser);
      setRoleDoc(doc);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '64px', opacity: 0.6, fontSize: '14px' }}>Memeriksa sesi...</div>
      </div>
    );
  }

  if (!user) return <AuthView />;

  const currentRole = roleOverride || roleDoc?.role || 'pending';

  if (currentRole === 'pending') {
    if (roleDoc && (!roleDoc.phone || !roleDoc.name || roleDoc.name === 'User' || roleDoc.name === 'Google User')) {
      return <CompleteProfileView roleDoc={roleDoc} />;
    }
    return (
      <div className="app-shell" style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <strong>Menunggu Persetujuan</strong>
          <p>Akun Anda sudah terdaftar, namun belum diverifikasi. Silakan hubungi admin kas atau ketua RT.</p>
          <button className="secondary-button" onClick={() => auth.signOut()} style={{ marginTop: 20 }}>Keluar</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentRole === 'admin' && <AdminApp />}
      {currentRole === 'warga' && <WargaApp userDoc={roleDoc as UserDoc} />}
      {currentRole === 'rt' && (
        <div className="app-shell" style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-state">
            <strong>Portal RT</strong>
            <p>Fitur ini sedang dalam pengembangan.</p>
            <button className="secondary-button" onClick={() => auth.signOut()} style={{ marginTop: 20 }}>Keluar</button>
          </div>
        </div>
      )}
      {currentRole === 'developer' && <DevApp roleDoc={roleDoc as UserDoc} setRoleOverride={setRoleOverride} />}
      {!['admin', 'warga', 'rt', 'developer'].includes(currentRole) && <UnauthorizedView onLogout={() => auth.signOut()} />}

      {roleOverride && (
        <button
          onClick={() => setRoleOverride(null)}
          style={{
            position: 'fixed',
            bottom: 100,
            right: 16,
            zIndex: 9999,
            background: 'var(--text-primary)',
            color: 'var(--bg)',
            border: 'none',
            padding: '12px 20px',
            borderRadius: 100,
            fontWeight: 800,
            fontSize: 13,
            boxShadow: '0 4px 14px rgba(0,0,0,0.28)',
            cursor: 'pointer',
          }}
        >
          Exit Bypass
        </button>
      )}
    </>
  );
}
