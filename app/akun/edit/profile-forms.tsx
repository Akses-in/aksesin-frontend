"use client";

import { ActionForm } from "../../_components/action-form";
import { EmailField, PasswordField } from "../../_components/credentials-form";
import { addEmailCredentials, startPhoneChange, updateAccountName } from "../actions";

export function EmailCredentialsForm({ pendingEmail }: { pendingEmail?: string }) {
  return (
    <ActionForm action={addEmailCredentials} className="credentials-form">
      {(pending, error) => (
        <>
          <p>{pendingEmail
            ? <>Menunggu verifikasi untuk <strong>{pendingEmail}</strong>.</>
            : "Tambahkan email dan password agar kamu juga bisa masuk lewat email."}</p>
          <fieldset className="form-fields" disabled={pending}>
            <EmailField id="account-email" label="Alamat email" />
            <PasswordField />
            <PasswordField confirmation />
          </fieldset>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="button primary" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan dan verifikasi email"}
          </button>
        </>
      )}
    </ActionForm>
  );
}

export function NameForm({ name }: { name: string }) {
  return (
    <ActionForm action={updateAccountName} className="credentials-form">
      {(pending, error) => (
        <>
          <div className="field">
            <label htmlFor="name">Nama di akunmu</label>
            <div className="input-shell">
              <input id="name" name="name" defaultValue={name} autoComplete="name"
                maxLength={100} disabled={pending} required />
            </div>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="button primary" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan nama"}
          </button>
        </>
      )}
    </ActionForm>
  );
}

export function PhoneForm({ phone }: { phone?: string }) {
  return (
    <ActionForm action={startPhoneChange} className="credentials-form">
      {(pending, error) => (
        <>
          <p>{phone ? <>Nomor saat ini <strong>{phone}</strong></> : "Tambahkan nomor WhatsApp ke akunmu."}</p>
          <div className="field">
            <label htmlFor="phone">Nomor WhatsApp baru</label>
            <div className="input-shell">
              <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="081234567890"
                maxLength={24} disabled={pending} aria-describedby="new-phone-hint" required />
            </div>
            <p id="new-phone-hint" className="small muted">Kami akan mengirim OTP ke nomor baru untuk memverifikasi perubahan.</p>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="button primary" disabled={pending}>
            {pending ? "Mengirim…" : "Kirim kode WhatsApp"}
          </button>
        </>
      )}
    </ActionForm>
  );
}
