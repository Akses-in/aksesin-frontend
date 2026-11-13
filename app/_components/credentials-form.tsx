"use client";

import Link from "next/link";
import { useState } from "react";
import { register, registerWithWhatsApp, signInWithEmail, signInWithWhatsApp } from "../actions";
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

export function EmailField({ id = "email", label = "Email", login = false }: {
  id?: string;
  label?: string;
  login?: boolean;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-shell">
        <input id={id} name="email" type="email" autoComplete={login ? "username" : "email"}
          placeholder="nama@email.com"
          autoCapitalize="none" spellCheck={false} maxLength={254} required />
      </div>
    </div>
  );
}

export function CredentialsForm({ mode = "register", showAccountLink = true }: {
  mode?: "register" | "register-whatsapp" | "email" | "whatsapp";
  showAccountLink?: boolean;
}) {
  const registering = mode === "register" || mode === "register-whatsapp";
  const whatsapp = mode === "whatsapp" || mode === "register-whatsapp";
  const action = whatsapp
    ? (registering ? registerWithWhatsApp : signInWithWhatsApp)
    : (registering ? register : signInWithEmail);
  const submitLabel = whatsapp ? "Kirim kode WhatsApp" : registering ? "Daftar akun" : "Masuk";

  return (
    <ActionForm action={action} className="credentials-form">
      {(pending, error) => (
        <>
          <fieldset className="form-fields" disabled={pending}>
            {registering && (
              <div className="field">
                <label htmlFor="name">Nama lengkap</label>
                <div className="input-shell">
                  <Icon name="register-user-round" size={18} />
                  <input id="name" name="name" placeholder="Masukkan nama lengkap" autoComplete="name" required maxLength={100} />
                </div>
              </div>
            )}
            {whatsapp ? <div className="field">
              <label htmlFor="identity">Nomor WhatsApp</label>
              <div className="input-shell">
                <input id="identity" name="identity"
                  type="tel" placeholder="081234567890" autoComplete="tel"
                  required maxLength={24}
                  aria-describedby="identity-hint"
                />
              </div>
              <p id="identity-hint" className="small muted">
                {registering ? "Kode verifikasi akan dikirim ke nomor ini." : "Gunakan nomor WhatsApp yang terdaftar di akunmu."}
              </p>
            </div> : (
              <>
                <EmailField login={!registering} />
                <PasswordField current={!registering} />
                {registering && <PasswordField confirmation />}
              </>
            )}
          </fieldset>

          {error && <p className="error" role="alert">{error}</p>}
          <div className="register-actions">
            <button className="button primary" type="submit" disabled={pending}>
              {pending ? (whatsapp ? "Mengirim…" : "Memproses…") : submitLabel}
              <Icon name="register-arrow-right" size={17} />
            </button>
            {registering && <p className="auth-terms small muted">Dengan mendaftar, kamu menyetujui <Link href="/ketentuan">Ketentuan Penggunaan</Link> dan <Link href="/privasi">Kebijakan Privasi</Link>.</p>}
          </div>
          {showAccountLink && <p className="alternate muted">
            {registering ? <>Sudah punya akun? <Link href="/masuk">Masuk</Link></> : <>Belum punya akun? <Link href="/register">Daftar</Link></>}
          </p>}
        </>
      )}
    </ActionForm>
  );
}
