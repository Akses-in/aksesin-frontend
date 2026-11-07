"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";

export function ActionForm({
  action, className, children,
}: {
  action: (data: FormData) => Promise<string>;
  className?: string;
  children: (pending: boolean, error: string) => React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const locked = useRef(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    const data = new FormData(event.currentTarget);
    setError("");
    startTransition(async () => {
      try {
        const message = await action(data);
        setError(message ?? "");
      } finally {
        locked.current = false;
      }
    });
  }

  return (
    <form method="post" className={className} aria-busy={pending} onSubmit={submit}>
      {children(pending, error)}
    </form>
  );
}
