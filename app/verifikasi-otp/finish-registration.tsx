"use client";

import { completeWhatsAppRegistration } from "../actions";
import { ActionForm } from "../_components/action-form";

export function FinishRegistration() {
  return (
    <ActionForm action={completeWhatsAppRegistration} className="credentials-form">
      {(pending, error) => (
        <>
          {error && <p role="alert" className="error">{error}</p>}
          <button type="submit" className="button primary" disabled={pending}>
            {pending ? "Membuat akun…" : "Selesaikan pendaftaran"}
          </button>
        </>
      )}
    </ActionForm>
  );
}
