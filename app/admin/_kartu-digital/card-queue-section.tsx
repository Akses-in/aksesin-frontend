import Form from "next/form";
import Link from "next/link";
import { RetryButton } from "../../_components/retry-button";
import { adminAccessToken, adminApi } from "../_impor-osm/backend";
import { formatWib } from "../_impor-osm/labels";
import {
  cardStatusValues,
  disabilityLabel,
  issuedCardStateMeta,
  statusBadge,
  type AdminCardListResult,
} from "./labels";

const BASE_PATH = "/admin/kartu-digital";
const PAGE_SIZE = 20;
type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value.trim() : "";
}

function readFilters(params: SearchParams) {
  const status = readParam(params, "status");
  const page = Number(readParam(params, "page"));
  return {
    q: readParam(params, "q").slice(0, 100),
    status: (cardStatusValues as readonly string[]).includes(status) ? status : "",
    page: Number.isInteger(page) && page > 0 ? Math.min(page, 10_000) : 1,
  };
}

type Filters = ReturnType<typeof readFilters>;

function pageHref(filters: Filters, page: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `${BASE_PATH}${query ? `?${query}` : ""}#daftar-pengajuan`;
}

function statusPillHref(filters: Filters, status: string) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status !== status) params.set("status", status);
  const query = params.toString();
  return `${BASE_PATH}${query ? `?${query}` : ""}#daftar-pengajuan`;
}

export async function CardQueueSection({ searchParams }: { searchParams: SearchParams }) {
  const token = await adminAccessToken();
  const filters = readFilters(searchParams);
  const query = new URLSearchParams({ page: String(filters.page), pageSize: String(PAGE_SIZE) });
  if (filters.q) query.set("q", filters.q);
  if (filters.status) query.set("status", filters.status);

  const result = await adminApi<AdminCardListResult>(`/api/admin/card-applications?${query}`, token);
  const filtered = Boolean(filters.q || filters.status);
  const totalPages = result.ok ? Math.max(1, Math.ceil(result.data.total / result.data.pageSize)) : 1;

  return (
    <>
      {result.ok && (
        <section className="status-card" aria-labelledby="card-summary-title">
          <div className="status-heading">
            <div>
              <p className="small muted">RINGKASAN ANTREAN</p>
              <h2 id="card-summary-title">Status pengajuan kartu</h2>
            </div>
            <span className="badge">{Object.values(result.data.statusCounts).reduce((a, b) => a + b, 0)} total</span>
          </div>
          <div className="badges">
            {cardStatusValues.map((status) => {
              const meta = statusBadge(status);
              const count = result.data.statusCounts[status] ?? 0;
              const active = filters.status === status;
              return (
                <Link
                  key={status}
                  href={statusPillHref(filters, status)}
                  prefetch={false}
                  className={active ? "badge active" : meta.badgeClass}
                  aria-current={active ? "true" : undefined}
                >
                  {meta.label}: {count}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="status-card" id="daftar-pengajuan" aria-labelledby="card-queue-title">
        <div className="status-heading">
          <div>
            <p className="small muted">ANTREAN VERIFIKASI</p>
            <h2 id="card-queue-title">Daftar pengajuan kartu</h2>
          </div>
          {result.ok && <span className="badge">{result.data.total} pengajuan</span>}
        </div>

        <Form
          action={BASE_PATH}
          className="card-admin-filters"
          scroll={false}
          prefetch={false}
          aria-label="Cari dan filter pengajuan kartu"
        >
          <div className="field">
            <label htmlFor="card-filter-q">Cari nama pemohon atau nomor kartu</label>
            <div className="input-shell">
              <input
                id="card-filter-q"
                name="q"
                type="search"
                defaultValue={filters.q}
                maxLength={100}
                placeholder="Contoh: Hafiz atau DAC-2026"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="card-filter-status">Status pengajuan</label>
            <div className="input-shell">
              <select id="card-filter-status" name="status" defaultValue={filters.status}>
                <option value="">Semua status</option>
                {cardStatusValues.map((status) => (
                  <option key={status} value={status}>
                    {statusBadge(status).label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="osm-filter-actions">
            <button type="submit" className="button secondary">Cari &amp; filter</button>
            {filtered && (
              <Link className="osm-text-link" href={`${BASE_PATH}#daftar-pengajuan`} prefetch={false}>
                Reset filter
              </Link>
            )}
          </div>
        </Form>

        {!result.ok ? (
          <div className="osm-load-error">
            <p className="error" role="alert">
              Daftar pengajuan kartu belum bisa dimuat. {result.message}
            </p>
            <RetryButton />
          </div>
        ) : !result.data.items.length ? (
          <div className="notice" role="status">
            <p>
              {filtered
                ? "Tidak ada pengajuan kartu yang cocok dengan kata kunci atau filter status ini."
                : "Belum ada pengajuan Digital Accessibility Card yang masuk."}
            </p>
          </div>
        ) : (
          <>
            <ul className="osm-place-list" aria-label="Antrean pengajuan Digital Accessibility Card">
              {result.data.items.map((item) => {
                const statusMeta = statusBadge(item.status);
                const cardStateMeta = item.cardState ? issuedCardStateMeta[item.cardState] : null;
                return (
                  <li key={item.id}>
                    <div className="card-admin-row">
                      <div className="osm-place-summary">
                        <p className="place-name">{item.fullName}</p>
                        <p className="place-meta">
                          {disabilityLabel(item.disabilityCategory)} · {item.documentCount} dokumen · Diajukan{" "}
                          {formatWib(item.submittedAt)}
                        </p>
                        <div className="badges">
                          <span className={statusMeta.badgeClass}>{statusMeta.label}</span>
                          {item.cardNumber && <span className="badge">No. {item.cardNumber}</span>}
                          {cardStateMeta && <span className={cardStateMeta.badgeClass}>{cardStateMeta.label}</span>}
                        </div>
                      </div>
                      <Link
                        className="button secondary"
                        href={`/admin/kartu-digital/${item.id}`}
                        prefetch={false}
                      >
                        Tinjau pengajuan
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
            <nav className="osm-pagination" aria-label="Halaman daftar pengajuan kartu">
              {filters.page > 1 ? (
                <Link className="osm-text-link" href={pageHref(filters, filters.page - 1)} prefetch={false} scroll={false}>
                  Halaman sebelumnya
                </Link>
              ) : (
                <span />
              )}
              <span className="small muted">
                Halaman {Math.min(filters.page, totalPages)} dari {totalPages}
              </span>
              {filters.page < totalPages ? (
                <Link className="osm-text-link" href={pageHref(filters, filters.page + 1)} prefetch={false} scroll={false}>
                  Halaman berikutnya
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </>
        )}
      </section>
    </>
  );
}
