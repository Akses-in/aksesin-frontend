"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button className="button secondary" type="button" disabled={pending}
      onClick={() => startTransition(() => router.refresh())}>
      {pending ? "Memuat…" : "Coba lagi"}
    </button>
  );
}
