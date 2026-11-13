import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
import { RetryButton } from "../../_components/retry-button";
import { markAdminNotificationRead } from "./actions";
import { adminAccessToken, adminApi, type ApiResult } from "./backend";
import { ImportControl } from "./import-control";
import {
  accessibilityAttributeKeys,
  accessibilityStatusMeta,
  attributeLabels,
  attributeValueLabel,
  formatWib,
  jobStatusMeta,
  osmUrl,
  type AdminNotification,
  type AdminPlace,
  type DuplicateCandidate,
  type ImportJob,
  type Page,
} from "./labels";
import { PlaceItem } from "./place-actions";

const BASE_PATH = "/admin/impor-osm";
const PAGE_SIZE = 20;
type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string) {
  const value = params[key];
  return typeof value === "string" ? value.trim() : "";
}

function readFilters(params: SearchParams) {
  const status = readParam(params, "status");
  const source = readParam(params, "source");
  const page = Number(readParam(params, "page"));
  return {
    q: readParam(params, "q").slice(0, 100),
    status: status in accessibilityStatusMeta ? status : "",
    source: source === "osm" || source === "manual" ? source : "",
    page: Number.isInteger(page) && page > 0 ? Math.min(page, 10_000) : 1,
  };
}

type Filters = ReturnType<typeof readFilters>;

function pageHref(filters: Filters, page: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.source) params.set("source", filters.source);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `${BASE_PATH}${query ? `?${query}` : ""}#daftar-tempat`;
}

function LoadError({ message }: { message: string }) {
  return (
    <div className="osm-load-error">
      <p className="error" role="alert">{message}</p>
      <RetryButton />
    </div>
  );
}

function SectionHeading({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="status-heading">
      <div>
        <p className="small muted">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Attribution() {
  return (
    <p className="small muted">
      Data tempat ©{" "}
      <a className="osm-text-link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
        kontributor OpenStreetMap<span className="osm-visually-hidden"> (membuka tab baru)</span>
      </a>
      , tersedia di bawah lisensi ODbL.
    </p>
  );
}

function ImportHistory({ result }: { result: ApiResult<Page<ImportJob>> }) {
  return (
    <section className="status-card" aria-labelledby="osm-history-title">
      <SectionHeading id="osm-history-title" eyebrow="RIWAYAT" title="Riwayat impor" />
      {!result.ok ? <LoadError message={`Riwayat impor belum bisa dimuat. ${result.message}`} /> : !result.data.items.length ? (
        <p className="muted" role="status">Belum ada riwayat impor.</p>
      ) : (
        <div className="osm-table-wrap" role="region" aria-labelledby="osm-history-title" tabIndex={0}>
          <table className="osm-table">
            <thead>
              <tr>
                <th scope="col">Mulai</th>
                <th scope="col">Selesai</th>
                <th scope="col">Status</th>
                <th scope="col">Diambil</th>
                <th scope="col">Baru</th>
                <th scope="col">Diperbarui</th>
                <th scope="col">Tidak berubah</th>
                <th scope="col">Dilewati</th>
                <th scope="col">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {result.data.items.map((job) => (
                <tr key={job.id}>
                  <td>{formatWib(job.startedAt ?? job.createdAt)}</td>
                  <td>{formatWib(job.finishedAt)}</td>
                  <td><span className={jobStatusMeta[job.status].badge}>{jobStatusMeta[job.status].label}</span></td>
                  <td>{job.fetchedCount}</td>
                  <td>{job.createdCount}</td>
                  <td>{job.updatedCount}</td>
                  <td>{job.unchangedCount}</td>
                  <td>{job.skippedCount}</td>
                  <td className="osm-table-note">
                    {job.errorMessage ?? (job.sourceEndpoint ? `Sumber: ${job.sourceEndpoint}` : "-")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Notifications({ result }: { result: ApiResult<{ items: AdminNotification[]; unreadCount: number }> }) {
  const unread = result.ok ? result.data.unreadCount : 0;
  return (
    <section className="status-card" aria-labelledby="osm-notification-title">
      <SectionHeading id="osm-notification-title" eyebrow="PEMBERITAHUAN" title="Notifikasi impor">
        {result.ok && (
          <span className={unread > 0 ? "badge active" : "badge"}>
            {unread > 0 ? `${unread} belum dibaca` : "Semua terbaca"}
          </span>
        )}
      </SectionHeading>
      {!result.ok ? <LoadError message={`Notifikasi belum bisa dimuat. ${result.message}`} /> : !result.data.items.length ? (
        <p className="muted" role="status">Belum ada notifikasi. Notifikasi muncul setiap kali impor selesai.</p>
      ) : (
        <ol className="notification-list" aria-label="Notifikasi hasil impor">
          {result.data.items.map((item) => (
            <li key={item.id} className={item.isRead ? "notification-item" : "notification-item unread"}>
              <div className="status-heading">
                <strong>{item.title}</strong>
                <span className="badges">
                  {!item.isRead && <span className="badge active">Belum dibaca</span>}
                  <span className={item.type === "osm_import_succeeded" ? "badge active" : "badge danger"}>
                    {item.type === "osm_import_succeeded" ? "Berhasil" : "Gagal"}
                  </span>
                </span>
              </div>
              <p>{item.message}</p>
              <div className="notification-footer">
                <span className="small muted">{formatWib(item.createdAt)}</span>
                {!item.isRead && (
                  <form action={markAdminNotificationRead}>
                    <input type="hidden" name="notification_id" value={item.id} />
                    <button type="submit" className="text-button">Tandai sudah dibaca</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function PlaceSummary({ place }: { place: AdminPlace }) {
  const status = accessibilityStatusMeta[place.accessibilityStatus];
  const attributes = accessibilityAttributeKeys.filter((key) => place.accessibilityAttributes[key]);
  const link = osmUrl(place);
  return (
    <div className="osm-place-summary">
      <p className="place-name">{place.name}</p>
      <p className="place-meta">{[place.category, place.address].filter(Boolean).join(" · ") || "Belum ada kategori dan alamat"}</p>
      <div className="badges">
        <span className={status.badge}>{status.label}</span>
        <span className="badge">{place.dataSource === "osm" ? "Sumber: OSM" : "Sumber: Manual"}</span>
        {place.editedByAdmin && <span className="badge">Diedit admin</span>}
        {place.savedCount > 0 && <span className="badge">Disimpan {place.savedCount} pengguna</span>}
      </div>
      {attributes.length ? (
        <dl className="osm-attributes">
          {attributes.map((key) => (
            <div key={key}>
              <dt>{attributeLabels[key]}</dt>
              <dd>{attributeValueLabel(place.accessibilityAttributes[key]!)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="small muted">Belum ada informasi aksesibilitas.</p>
      )}
      {link && (
        <a className="osm-text-link small" href={link} target="_blank" rel="noopener noreferrer">
          Lihat di OpenStreetMap<span className="osm-visually-hidden"> (membuka tab baru)</span>
        </a>
      )}
    </div>
  );
}

function PlaceList({ result, filters }: { result: ApiResult<Page<AdminPlace>>; filters: Filters }) {
  const totalPages = result.ok ? Math.max(1, Math.ceil(result.data.total / result.data.pageSize)) : 1;
  const filtered = Boolean(filters.q || filters.status || filters.source);
  return (
    <section className="status-card" id="daftar-tempat" aria-labelledby="osm-places-title">
      <SectionHeading id="osm-places-title" eyebrow="DATA TEMPAT" title="Daftar tempat">
        {result.ok && <span className="badge">{result.data.total} tempat</span>}
      </SectionHeading>

      <Form action={BASE_PATH} className="osm-filters" scroll={false} prefetch={false} aria-label="Filter daftar tempat">
        <div className="field">
          <label htmlFor="osm-filter-q">Cari nama tempat</label>
          <div className="input-shell">
            <input id="osm-filter-q" name="q" type="search" defaultValue={filters.q} maxLength={100} placeholder="Contoh: Stasiun" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="osm-filter-status">Status aksesibilitas</label>
          <div className="input-shell">
            <select id="osm-filter-status" name="status" defaultValue={filters.status}>
              <option value="">Semua status</option>
              {Object.entries(accessibilityStatusMeta).map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="osm-filter-source">Sumber data</label>
          <div className="input-shell">
            <select id="osm-filter-source" name="source" defaultValue={filters.source}>
              <option value="">Semua sumber</option>
              <option value="osm">OpenStreetMap</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
        <div className="osm-filter-actions">
          <button type="submit" className="button secondary">Terapkan filter</button>
          {filtered && <Link className="osm-text-link" href={`${BASE_PATH}#daftar-tempat`} prefetch={false}>Hapus filter</Link>}
        </div>
      </Form>

      {!result.ok ? <LoadError message={`Daftar tempat belum bisa dimuat. ${result.message}`} /> : !result.data.items.length ? (
        <div className="notice" role="status">
          <p>{filtered ? "Tidak ada tempat yang cocok dengan filter ini." : "Belum ada data tempat. Jalankan impor OSM untuk mengisi data."}</p>
        </div>
      ) : (
        <>
          <ul className="osm-place-list" aria-label="Daftar tempat">
            {result.data.items.map((place) => (
              <li key={place.id}>
                <PlaceItem place={place} reason="invalid" editable>
                  <PlaceSummary place={place} />
                </PlaceItem>
              </li>
            ))}
          </ul>
          <nav className="osm-pagination" aria-label="Halaman daftar tempat">
            {filters.page > 1 ? (
              <Link className="osm-text-link" href={pageHref(filters, filters.page - 1)} prefetch={false} scroll={false}>Halaman sebelumnya</Link>
            ) : <span />}
            <span className="small muted">Halaman {Math.min(filters.page, totalPages)} dari {totalPages}</span>
            {filters.page < totalPages ? (
              <Link className="osm-text-link" href={pageHref(filters, filters.page + 1)} prefetch={false} scroll={false}>Halaman berikutnya</Link>
            ) : <span />}
          </nav>
        </>
      )}
    </section>
  );
}

function Duplicates({ result }: { result: ApiResult<{ items: DuplicateCandidate[] }> }) {
  return (
    <section className="status-card" aria-labelledby="osm-duplicates-title">
      <SectionHeading id="osm-duplicates-title" eyebrow="PERIKSA DATA" title="Kandidat duplikat">
        {result.ok && <span className={result.data.items.length ? "badge warning" : "badge"}>{result.data.items.length} pasangan</span>}
      </SectionHeading>
      <p className="small muted">Tempat dengan nama sama yang berjarak kurang dari 50 meter. Periksa lalu hapus salah satu bila memang ganda.</p>
      {!result.ok ? <LoadError message={`Kandidat duplikat belum bisa dimuat. ${result.message}`} /> : !result.data.items.length ? (
        <p className="muted" role="status">Tidak ada kandidat duplikat.</p>
      ) : (
        <ul className="osm-duplicate-list" aria-label="Pasangan kandidat duplikat">
          {result.data.items.map((pair) => (
            <li key={`${pair.places[0].id}-${pair.places[1].id}`}>
              <p className="small muted">Jarak sekitar {Math.round(pair.distanceMeters)} meter</p>
              <div className="osm-duplicate-pair">
                {pair.places.map((place) => (
                  <div key={place.id} className="osm-duplicate-item">
                    <PlaceItem place={place} reason="duplicate">
                      <PlaceSummary place={place} />
                    </PlaceItem>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export async function OsmImportSection({ searchParams }: { searchParams: SearchParams }) {
  const token = await adminAccessToken();
  const filters = readFilters(searchParams);
  const placeQuery = new URLSearchParams({ page: String(filters.page), pageSize: String(PAGE_SIZE) });
  if (filters.q) placeQuery.set("q", filters.q);
  if (filters.status) placeQuery.set("status", filters.status);
  if (filters.source) placeQuery.set("source", filters.source);

  const [jobs, notifications, places, duplicates] = await Promise.all([
    adminApi<Page<ImportJob>>("/api/admin/osm-imports?pageSize=10", token),
    adminApi<{ items: AdminNotification[]; unreadCount: number }>("/api/admin/notifications", token),
    adminApi<Page<AdminPlace>>(`/api/admin/places?${placeQuery}`, token),
    adminApi<{ items: DuplicateCandidate[] }>("/api/admin/places/duplicates", token),
  ]);
  const latest = jobs.ok ? jobs.data.items[0] ?? null : null;

  return (
    <>
      {jobs.ok ? (
        <ImportControl key={`${latest?.id ?? "none"}-${latest?.status ?? ""}`} initialJob={latest} />
      ) : (
        <section className="status-card" aria-labelledby="osm-status-title">
          <h2 id="osm-status-title">Impor terakhir</h2>
          <LoadError message={`Status impor belum bisa dimuat. ${jobs.message}`} />
        </section>
      )}
      <ImportHistory result={jobs} />
      <Notifications result={notifications} />
      <PlaceList result={places} filters={filters} />
      <Duplicates result={duplicates} />
      <Attribution />
    </>
  );
}
