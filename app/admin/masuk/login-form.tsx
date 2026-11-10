"use client";

import { ActionForm } from "../../_components/action-form";
import { PasswordField } from "../../_components/credentials-form";
import { Icon } from "../../_components/site";
import { signInAdmin } from "../actions";

export function AdminLoginForm() {
  return (
    <ActionForm action={signInAdmin} className="credentials-form">
      {(pending, error) => (
        <>
          <fieldset className="form-fields" disabled={pending}>
            <div className="field">
              <label htmlFor="email">Email admin</label>
              <div className="input-shell">
                <Icon name="register-mail" size={18} />
                <input id="email" name="email" type="email" autoComplete="username"
                  autoCapitalize="none" maxLength={254} required />
              </div>
            </div>
            <PasswordField current />
          </fieldset>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="button primary" disabled={pending}>
            {pending ? "Memeriksa akun…" : "Masuk ke admin"}
            <Icon name="register-arrow-right" size={17} />
          </button>
        </>
      )}
    </ActionForm>
  );
}
