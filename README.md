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
