# Aksesin

Frontend Next.js untuk registrasi akun dan onboarding preferensi aksesibilitas.

## Pengembangan lokal

1. Jalankan `npm ci`.
2. Isi `.env.local` dari `.env.example`. Gunakan URL proyek dan publishable key Supabase. Setel `APP_ORIGIN=http://localhost:3001`.
3. Jalankan `npm run dev`, lalu buka [localhost:3001](http://localhost:3001).

Registrasi tersedia di `/register`, preferensi di `/onboarding`, dan ringkasan di `/akun`. Setelah verifikasi, pengguna bisa menyimpan preferensi atau melewati langkah itu. Untuk menghapus preferensi yang sudah disimpan, kosongkan semua isian dan simpan kembali.

Auth dan preferensi diakses dari server Next.js dengan sesi pengguna. Skema preferensi dan kebijakan RLS berada di migrasi Supabase pada repositori `aksesin-backend`.

## OTP WhatsApp lewat Fonnte

Untuk masuk, pengguna memasukkan nomor WhatsApp yang sudah terverifikasi di akun, lalu kode OTP enam digit. Saat mendaftar, pengguna masih mengisi nama, memverifikasi nomor WhatsApp, dan membuat password.

Jalankan backend Express sesuai [panduan backend](../aksesin-backend/README.md#otp-whatsapp-lewat-fonnte). Frontend menggunakan `BACKEND_URL=http://127.0.0.1:3000` secara default.

- [Fonnte API](https://docs.fonnte.com/api-send-message/)

## Ruang admin

Buka `/admin` lalu masuk menggunakan email dan password akun admin. Akses memerlukan email terverifikasi dan `app_metadata.role` bernilai `admin` pada Supabase Auth. Sesi admin disimpan terpisah dari sesi pengguna.

### Menyiapkan akun admin

Buat atau pilih akun dengan email terverifikasi di **Supabase Dashboard → Authentication → Users**, lalu salin UUID akun itu. Jalankan perintah berikut dari repositori `aksesin-backend` yang sudah dikonfigurasi. Pastikan `SUPABASE_URL` mengarah ke proyek yang benar dan gunakan UUID akun yang memang berhak menjadi admin.

```sh
ADMIN_USER_ID='UUID_AKUN_ADMIN' node --env-file=.env --input-type=module <<'NODE'
import { createClient } from '@supabase/supabase-js';

const { ADMIN_USER_ID, SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!ADMIN_USER_ID || !SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error('Konfigurasi pemberian akses admin belum lengkap.');
}
const client = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await client.auth.admin.getUserById(ADMIN_USER_ID);
if (error || !data.user?.email_confirmed_at) {
  throw new Error('Gunakan UUID akun dengan email terverifikasi.');
}
const result = await client.auth.admin.updateUserById(ADMIN_USER_ID, {
  app_metadata: { role: 'admin' },
});
if (result.error) throw new Error('Peran admin gagal disimpan.');
console.log('Peran admin tersimpan.');
NODE
```

Siapkan password akun melalui Supabase Auth. Menu **Peta**, **Pengguna**, **Komunitas**, dan **Postingan** memiliki route masing-masing. Halaman tersebut menampilkan status integrasi sampai data dan tindakan pengelolaan tersedia.
