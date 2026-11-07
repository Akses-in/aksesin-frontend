<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Aksesin Frontend

Panduan ini berlaku untuk repositori frontend. Backend Express punya `AGENTS.md` sendiri. Jalankan perintah dari direktori repositori yang sedang dikerjakan.

## Mulai dari implementasi yang ada

- Baca halaman dan komponen terdekat sebelum mengubah UI. Pertahankan kontrak route, alur akun, dan perilaku yang sudah dipakai kecuali perubahan itu diminta.
- Buat perubahan sekecil mungkin. Pakai pola dan komponen yang tersedia. Tambahkan abstraksi, dependency, atau token hanya jika kebutuhan fiturnya belum terwakili.
- Jadikan [Figma Aksesin](https://www.figma.com/design/l179ucajHACPF1qbuZVVMR/Akses.in?node-id=1-2) referensi visual untuk layar yang punya desain. Gunakan layout fleksibel dan perilaku interaktif dari aplikasi saat menerjemahkan frame.

## Sumber desain dan komponen

| Kebutuhan | Gunakan |
| --- | --- |
| Warna, tipografi, ukuran kontrol, dan responsivitas | `app/globals.css` dan font Roboto lokal dari `app/layout.tsx` |
| Header, footer, menu akun, dan ikon | `Site` dan `Icon` dari `app/_components/site.tsx`. Ambil aset lokal dari `public/figma/` |
| Lebar konten dan susunan halaman | `.site-width` untuk layout lebar, `.narrow-main` untuk form satu kolom, serta `.page-stack`, `.page-heading`, dan `.panel` |
| Form dan aksi | `ActionForm`, `.field`, `.input-shell`, `.button.primary`, dan `.button.secondary` |
| Password, OTP, dan retry | `PasswordField` di `app/_components/credentials-form.tsx`, `OtpForm` di `app/verifikasi-otp/otp-form.tsx`, dan `RetryButton` di `app/_components/retry-button.tsx` |
| Umpan balik | `.notice`, `.error`, dan `.loading` sesuai status |

- Gunakan token yang sudah ada, antara lain `--background`, `--ink`, `--muted`, `--green`, `--green-dark`, `--mint`, `--border`, dan `--input`. Ikuti CSS yang ada di `app/globals.css`. Batasi selector khusus fitur pada komponennya.
- Lihat `app/register/page.tsx` untuk layout registrasi, `app/akun/edit/page.tsx` untuk form pengaturan, dan `app/onboarding/` untuk pilihan opsional. Pertahankan pemisahan layar nomor WhatsApp, OTP, dan password saat mengubah registrasi.
- Pakai Bahasa Indonesia yang singkat. Gunakan label tindakan yang spesifik seperti **Simpan nama** atau **Kirim kode WhatsApp**. Satu tindakan utama per form. Tampilkan hasil, proses, dan kegagalan di dekat tindakan yang memicunya.
- Pakai elemen HTML semantik dan label nyata untuk setiap input. Pertahankan fokus keyboard, skip link ke `main#konten`, dan target sentuh minimal 44 px. Pakai `role="alert"` untuk error yang baru muncul dan `role="status"` untuk status informatif. Pada OTP, pertahankan satu input yang mendukung tempel dan autofill.
- Ikuti breakpoint 820, 600, dan 420 px bila sesuai dengan layout yang ada. Biarkan kolom menumpuk dan teks panjang membungkus. Cek nama panjang, pesan error, fokus, dan tombol pada layar sempit.

## Struktur dan batas keamanan

- Letakkan route di `app/` dan komponen khusus fitur di dekat route. Simpan komponen yang dipakai ulang lintas route di `app/_components/`. Gunakan Server Components secara default. Tambahkan `"use client"` untuk interaksi yang memerlukan state atau event browser.
- Ikuti pola `Suspense` pada route yang membaca cookie atau sesi karena Cache Components aktif. Pakai `verifiedAccount()` di `lib/supabase.ts` untuk melindungi halaman dan validasi ulang akun di setiap Server Action yang mengubah data.
- Panggil backend WhatsApp lewat server Next.js dan `lib/whatsapp-otp.ts`. Pertahankan token sesi dan bukti verifikasi di sisi server atau cookie HttpOnly. Rahasiakan token Fonnte, Supabase secret key, OTP, password, dan connection string.
- Perlakukan preferensi aksesibilitas sebagai data opsional dan privat. Pertahankan jalur lewati serta pembatasan akses berdasarkan pemilik akun. Jaga kompatibilitas login email untuk akun lama.

## Cek sebelum menyerahkan perubahan

- Jalankan `npm run lint` dan `npm run build`. Frontend lokal berjalan di port 3001 dan Express di port 3000.
- Untuk perubahan UI, cek alur di browser pada lebar sekitar 320/390, 768, dan 1200 px. Uji jalur berhasil, validasi, pending, error, dan navigasi keyboard yang terdampak.
- Untuk perubahan lintas repositori, cocokkan route, payload, dan status HTTP dengan implementasi backend. Gunakan provider tiruan untuk pengujian rutin OTP.
