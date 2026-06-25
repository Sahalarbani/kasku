# Kasku

Kasku adalah aplikasi PWA/WebView modern untuk manajemen uang kas berbasis grup, dikhususkan untuk warga dan administrator tingkat RT/organisasi. Dilengkapi dengan portal berjenjang (Warga, Admin, RT, Developer), fitur otentikasi Firebase, laporan real-time, manajemen pengguna dengan role, serta sistem persetujuan dan riwayat transaksi.

## Fitur Utama

- **Otentikasi Multi-Sistem:** Email & Password serta Google Sign-In via Firebase Auth. Terdapat validasi _Pending State_ dan paksaan _Complete Profile_ agar nama/nomor handphone tersimpan dengan benar.
- **Role-Based Portals:**
  - **Admin:** Mengelola warga, memvalidasi bayar/transaksi (mencegah kas negatif), menyetujui user dan mencatat transaksi kas masuk/keluar.
  - **Warga:** Melihat tagihan, tautan multia-anggota untuk melihat riwayat bayaran keluarga/titipan, meminta persetujuan pembayaran dengan bukti kas.
  - **Developer:** Konsol khusus untuk melihat audit trail langsung ke database Firestore.
- **Push Notification:** Dukungan Vercel API `api/notify.ts` dengan Firebase Admin SDK untuk menembak push notification.
- **UI Premium:** Tema gelap, antarmuka berbentuk _Premium Solid Shell_, bebas tag native `select` di perangkat mobile berkat `PremiumDropdown`, dan _Floating Bypass Button_.
- **Web & Native APK:** Termasuk source Android WebView (`apk-webview/`) khusus untuk _wrapper_ dengan dukungan background notification.

## Prasyarat Lingkungan

Proyek ini dibangun menggunakan [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/). Anda akan membutuhkan:
- Node.js versi LTS (v18+)
- Firebase Project yang mendukung Auth, Firestore, dan Cloud Messaging.
- Akun Vercel (jika ingin men-deploy service notifikasi secara serverless).

## Instalasi

1. **Clone repositori dan pasang dependensi:**
   ```bash
   npm install
   ```

2. **Pengaturan Variabel Lingkungan:**
   Salin atau buat file `.env` di root direktori dengan kredensial Firebase Anda. Contoh:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Menjalankan Development Server:**
   ```bash
   npm run dev
   ```
   Akses aplikasi pada `http://localhost:5173`. Aplikasi akan mendengarkan ke host `0.0.0.0` sehingga bisa diakses juga lewat IP lokal untuk testing mobile.

## Struktur Repositori

```
kasku/
├── api/                # Vercel Serverless Functions (ex: notify.ts)
├── apk-webview/        # Android Studio Project untuk native wrapper
├── src/
│   ├── portals/        # Modul Berbasis Role (Admin, Warga, Developer, RT)
│   ├── shared/         # Komponen UI, Layanan Firebase (Auth, Finance), Types, Hooks
│   ├── App.tsx         # Root Auth Gateway dan Portal Router
│   └── index.css       # Premium WebView Armor Styles
├── package.json        # Dependensi React, Vite, Firebase, dll
└── PROJECT_REGISTRY.md # Log progress tugas (Task Tracker)
```

## Build untuk Produksi

```bash
npm run build
```
Perintah ini akan menjalankan kompilasi TypeScript terlebih dahulu lalu Vite membangun _bundle_ statis di folder `dist/`.

## Deployment

Aplikasi React (Vite) dapat dideploy langsung ke [Vercel](https://vercel.com/) atau layanan hosting statis lainnya (seperti Firebase Hosting, Netlify).
Jika mendeploy di Vercel, pastikan fungsi di folder `api/` dijalankan dengan benar sebagai _Serverless Functions_ agar layanan notifikasi beroperasi.
