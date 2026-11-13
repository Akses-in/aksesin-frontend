export function loginEmail(value: FormDataEntryValue | null | undefined) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    !email.endsWith("@accounts.aksesin.invalid") ? email : null;
}

export function newPasswordError(password: FormDataEntryValue | null, confirmation: FormDataEntryValue | null) {
  if (typeof password !== "string" || password.length < 8 || new TextEncoder().encode(password).length > 72 ||
    !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Gunakan minimal 8 karakter, dengan huruf besar, huruf kecil, dan angka. Panjang maksimum 72 byte.";
  }
  return password !== confirmation ? "Konfirmasi password belum sama." : null;
}
