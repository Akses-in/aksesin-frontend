import { notFound } from "next/navigation";
import { Suspense } from "react";
import { adminSections } from "../sections";
import { AdminWorkspace } from "../workspace";

export function generateStaticParams() {
  return adminSections.map(({ slug }) => ({ bagian: slug }));
}

async function Section({ params }: Pick<PageProps<"/admin/[bagian]">, "params">) {
  const { bagian } = await params;
  const section = adminSections.find(({ slug }) => slug === bagian);
  if (!section) notFound();

  return <AdminWorkspace section={section} />;
}

export default function AdminSectionPage({ params }: PageProps<"/admin/[bagian]">) {
  return (
    <Suspense fallback={<p className="loading" role="status">Memuat ruang admin…</p>}>
      <Section params={params} />
    </Suspense>
  );
}
