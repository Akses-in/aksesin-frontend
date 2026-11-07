"use client";

import { useState } from "react";
import { resendWhatsAppOtp, verifyWhatsAppOtp } from "../actions";
import { ActionForm } from "../_components/action-form";

export function OtpForm() {
  const [code, setCode] = useState("");
  const [caret, setCaret] = useState(0);

  return (
    <>
      <ActionForm action={verifyWhatsAppOtp} className="credentials-form">
        {(pending, error) => (
          <>
            <div className="field">
              <label htmlFor="otp">Kode OTP</label>
              <div className="otp-code">
                <input id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code"
                  pattern="[0-9]{6}" required disabled={pending} value={code}
                  aria-invalid={Boolean(error)} aria-describedby={error ? "otp-error" : undefined}
                  onChange={(event) => {
                    const next = event.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(next);
                    setCaret(Math.min(event.target.selectionStart ?? next.length, next.length));
                  }}
                  onSelect={(event) => setCaret(event.currentTarget.selectionStart ?? code.length)}
                />
                {Array.from({ length: 6 }, (_, index) => (
                  <span key={index} aria-hidden="true" className="otp-digit"
                    data-active={index === Math.min(caret, 5) ? "" : undefined}>
                    {code[index] ?? ""}
                  </span>
                ))}
              </div>
            </div>
            {error && <p id="otp-error" role="alert" className="error">{error}</p>}
            <button type="submit" className="button primary" disabled={pending}>
              {pending ? "Memeriksa…" : "Verifikasi kode"}
            </button>
          </>
        )}
      </ActionForm>
      <ActionForm action={resendWhatsAppOtp} className="otp-resend">
        {(pending, error) => (
          <>
            <p className="small muted">Belum menerima kode?</p>
            <button type="submit" className="text-button" disabled={pending}>
              {pending ? "Mengirim…" : "Kirim ulang"}
            </button>
            {error && <p role="alert" className="error">{error}</p>}
          </>
        )}
      </ActionForm>
    </>
  );
}
