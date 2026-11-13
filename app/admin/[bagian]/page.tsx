import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OsmImportSection } from "../_impor-osm/osm-import-section";
import { adminSections } from "../sections";
import { AdminWorkspace } from "../workspace";

export function generateStaticParams() {
  return adminSections.map(({ slug }) => ({ bagian: slug }));
}

async function Section({ params, searchParams }: Pick<PageProps<"/admin/[bagian]">, "params" | "searchParams">) {
  const { bagian } = await params;
  const section = adminSections.find(({ slug }) => slug === bagian);
  if (!section) notFound();

  if (section.slug === "impor-osm") {
    return (
      <AdminWorkspace section={section}>
        <OsmImportSection searchParams={await searchParams} />
      </AdminWorkspace>
    );
  }
  return <AdminWorkspace section={section} />;
}

export default function AdminSectionPage({ params, searchParams }: PageProps<"/admin/[bagian]">) {
  return (
    <Suspense fallback={<p className="loading" role="status">Memuat ruang admin…</p>}>
      <Section params={params} searchParams={searchParams} />
    </Suspense>
  );
}
