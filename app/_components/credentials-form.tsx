"use client";

import Link from "next/link";
import { useState } from "react";
import { register, signIn } from "../actions";
import { ActionForm } from "./action-form";
import { Icon } from "./site";

export function PasswordField({ confirmation = false, current = false }: {
  confirmation?: boolean;
  current?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const field = confirmation ? "confirmation" : "password";

  return (
    <div className="field">
      <label htmlFor={field}>{confirmation ? "Konfirmasi password" : "Password"}</label>
      <div className="input-shell">
        <Icon name="register-lock-keyhole" size={18} />
        <input id={field} name={field} type={visible ? "text" : "password"}
          placeholder={current ? "Masukkan password" : confirmation ? "Ulangi password" : "Buat password"}
          autoComplete={current ? "current-password" : "new-password"} required
          minLength={current ? undefined : 8} maxLength={current ? 256 : 72}
          aria-describedby={!confirmation && !current ? "password-hint" : undefined}
        />
        <button className="password-toggle" type="button" aria-controls={field} aria-pressed={visible}
          aria-label={confirmation ? "Tampilkan konfirmasi password" : "Tampilkan password"}
          onClick={() => setVisible(!visible)}>
          {visible ? <Icon name="summary-eye" size={15} /> : <Icon name="register-eye-off" size={18} />}
        </button>
      </div>
      {!confirmation && !current && <p id="password-hint" className="small muted">Minimal 8 karakter, dengan huruf besar, huruf kecil, dan angka.</p>}
    </div>
  );
}

export function CredentialsForm({ login = false }: { login?: boolean }) {
  return (
    <ActionForm action={login ? signIn : register} className="credentials-form">
      {(pending, error) => (
        <>
          <fieldset className="form-fields" disabled={pending}>
            {!login && (
              <div className="field">
                <label htmlFor="name">Nama lengkap</label>
                <div className="input-shell">
                  <Icon name="register-user-round" size={18} />
                  <input id="name" name="name" placeholder="Masukkan nama lengkap" autoComplete="name" required maxLength={100} />
                </div>
              </div>
            )}
            <div className="field">
              <label htmlFor="identity">Nomor WhatsApp</label>
              <div className="input-shell">
                <input id="identity" name="identity"
                  type="tel" placeholder="081234567890" autoComplete="tel"
                  required maxLength={24}
                  aria-describedby="identity-hint"
                />
              </div>
              <p id="identity-hint" className="small muted">
                {login ? "Gunakan nomor WhatsApp yang terdaftar di akunmu." : "Kami akan mengirim kode verifikasi ke nomor ini."}
              </p>
            </div>
          </fieldset>

          {!login && <p className="small muted">Dengan membuat akun, kamu menyetujui <Link href="/ketentuan">Ketentuan Penggunaan</Link> dan telah membaca <Link href="/privasi">Kebijakan Privasi</Link>.</p>}
          {error && <p className="error" role="alert">{error}</p>}
          <div className="register-actions">
            <button className="button primary" type="submit" disabled={pending}>
              {pending ? "Mengirim…" : "Kirim kode WhatsApp"}
              <Icon name="register-arrow-right" size={17} />
            </button>
            {!login && <p className="icon-line small muted"><Icon name="register-shield-check" size={17} />Data disabilitas tidak diperlukan untuk membuat akun.</p>}
          </div>
          <p className="alternate muted">
            {login ? <>Belum punya akun? <Link href="/register">Daftar</Link></> : <>Sudah punya akun? <Link href="/masuk">Masuk</Link></>}
          </p>
        </>
      )}
    </ActionForm>
  );
}
