# Almanance

Aplikasi pencatat keuangan pribadi berbasis React Native (Expo). Catat pemasukan dan pengeluaran secara manual, lewat **foto struk**, atau lewat **suara**, lalu pantau saldo, budget bulanan, dan riwayat transaksi.

## Fitur

- **Autentikasi** email dan password dengan verifikasi kode (Clerk)
- **Onboarding**: pilih mata uang dan isi saldo awal
- **Home**: total saldo, ringkasan pemasukan dan pengeluaran bulan ini, progres budget, pie chart per kategori, transaksi terbaru
- **Tambah transaksi**:
  - manual
  - scan struk (kamera atau galeri)
  - voice log (ucapkan transaksinya, mis. "makan siang dua puluh ribu")
- **Transaksi**: filter (semua, pemasukan, pengeluaran), pencarian, grafik harian, hapus satu atau banyak sekaligus, export CSV (30 hari terakhir)
- **Budget bulanan** yang bisa diatur dari Home

Dalam pengembangan: tab Assistant, halaman Profile, dan pengelolaan akun (tambah, ubah, hapus, akun default).

## Tech stack

| Bagian | Teknologi |
|---|---|
| Framework | Expo SDK 54, React Native 0.81, Expo Router |
| Styling | NativeWind (Tailwind) |
| Auth | Clerk (`@clerk/expo`) |
| Database | Supabase (Postgres + RLS), diakses dengan token Clerk |
| Data fetching | TanStack Query |
| State | Zustand |
| Form | react-hook-form + zod |
| AI | Groq (Whisper untuk suara, model vision untuk struk, model teks untuk ekstraksi), dipanggil lewat Supabase Edge Function |

## Struktur folder

```
app/            Layar dan routing (Expo Router)
components/     Komponen UI
constants/      Kategori dan tema
hooks/          Query, mutation, dan hook Supabase
lib/            Service (akses data), schema zod, util
store/          State global (Zustand)
types/          Tipe TypeScript
supabase/       Edge Function dan SQL
```

## Menjalankan di lokal

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Buat file `.env` di root proyek:

   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
   EXPO_PUBLIC_SUPABASE_URL=
   EXPO_PUBLIC_SUPABASE_KEY=
   ```

   Key Groq **tidak** disimpan di aplikasi. Key itu hanya ada sebagai secret di Supabase (lihat bagian berikut).

3. Jalankan aplikasi:

   ```bash
   npx expo start
   ```

   Gunakan `npx expo start -c` untuk membersihkan cache setelah mengubah file di `lib/` atau `.env`.

## Setup Supabase

### 1. Integrasi Clerk

Di Supabase Dashboard buka **Authentication → Sign In / Up → Third Party Auth**, lalu tambahkan Clerk. Dengan ini Supabase menerima token Clerk, dan kebijakan RLS bisa memakai `auth.jwt()->>'sub'` sebagai id pengguna.

### 2. Tabel

Tabel yang dipakai aplikasi: `user`, `accounts`, `transactions`, dan `budgets`. Aktifkan RLS di semuanya, dan batasi akses ke baris milik pengguna yang sedang login.

### 3. Trigger saldo akun

Saldo akun dihitung oleh database, bukan oleh aplikasi, supaya tetap akurat meski ada beberapa operasi bersamaan. Jalankan `supabase/balance_trigger.sql` di **SQL Editor**. Setelah itu setiap tambah, ubah, atau hapus transaksi otomatis menyesuaikan `accounts.balance`.

> Jangan menghitung atau mengubah saldo di kode aplikasi, nanti terhitung dua kali.

### 4. Edge Function untuk AI

Pemanggilan Groq dilakukan di server lewat function `extract-transaction`.

1. Buat function bernama `extract-transaction` dan isi dengan `supabase/functions/extract-transaction/index.ts` (lewat Dashboard atau `supabase functions deploy extract-transaction --no-verify-jwt`).
2. Matikan **Verify JWT**. Pengecekan login dilakukan di dalam kode function, karena token Clerk tidak lolos pemeriksaan bawaan Supabase.
3. Tambahkan secret `GROQ_API_KEY` di **Edge Functions → Secrets**.

## Catatan pengembangan

- Semua parsing nominal memakai `parseAmount` di `lib/utils.ts`, yang menerima format `1.500.000` maupun `1,500,000`. Jangan memakai `parseFloat` langsung pada input pengguna.
- Format mata uang memakai `formatPrice` di `lib/utils.ts`.
- Transaksi dengan deskripsi `Starting balance` dibuat saat onboarding dan tidak dihitung sebagai pemasukan di ringkasan.

## Script

| Perintah | Fungsi |
|---|---|
| `npm start` | Menjalankan Expo |
| `npm run android` | Menjalankan di Android |
| `npm run ios` | Menjalankan di iOS |
| `npm run lint` | Menjalankan lint |