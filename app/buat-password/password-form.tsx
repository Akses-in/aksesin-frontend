"use client";

import { completeWhatsAppRegistration } from "../actions";
import { ActionForm } from "../_components/action-form";
import { PasswordField } from "../_components/credentials-form";

export function PasswordForm() {
  return (
    <ActionForm action={completeWhatsAppRegistration} className="credentials-form">
      {(pending, error) => (
        <>
          <fieldset className="form-fields" disabled={pending}>
            <PasswordField />
            <PasswordField confirmation />
          </fieldset>
          {error && <p role="alert" className="error">{error}</p>}
          <button type="submit" className="button primary" disabled={pending}>
            {pending ? "Membuat akun…" : "Buat akun"}
          </button>
        </>
      )}
    </ActionForm>
  );
}
