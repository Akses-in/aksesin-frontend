"use client";

import { ActionForm } from "../../_components/action-form";
import { startPhoneChange, updateAccountName } from "../actions";

export function ProfileForms({ name, phone }: { name: string; phone?: string }) {
  return (
    <>
      <section className="panel page-stack">
        <h2>Nama lengkap</h2>
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
      </section>

      <section className="panel page-stack">
        <div className="page-heading">
          <h2>Nomor WhatsApp</h2>
          <p>{phone ? <>Nomor saat ini <strong>{phone}</strong></> : "Tambahkan nomor WhatsApp ke akunmu."}</p>
        </div>
        <ActionForm action={startPhoneChange} className="credentials-form">
          {(pending, error) => (
            <>
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
      </section>
    </>
  );
}
