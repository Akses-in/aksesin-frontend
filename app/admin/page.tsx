import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminWorkspace } from "./workspace";

export const metadata: Metadata = { title: "Ringkasan admin" };

async function Overview({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const { keluar } = await searchParams;
  return <AdminWorkspace logoutFailed={keluar === "gagal"} />;
}

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<p className="loading" role="status">Memuat ruang admin…</p>}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}
