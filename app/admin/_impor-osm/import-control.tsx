"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getOsmImportJob, startOsmImport } from "./actions";
import { formatWib, isActiveJob, jobStatusMeta, skipReasonLabels, type ImportJob } from "./labels";

const POLL_INTERVAL_MS = 5000;

function statusSentence(job: ImportJob | null) {
  if (!job) return "Belum pernah ada impor. Jalankan impor pertama untuk mengisi data tempat.";
  if (job.status === "queued") return "Impor menunggu giliran. Status diperbarui otomatis setiap 5 detik.";
  if (job.status === "running") return "Impor sedang berjalan. Status diperbarui otomatis setiap 5 detik.";
  if (job.status === "succeeded") return "Impor terakhir berhasil.";
  return "Impor terakhir gagal. Data tempat yang tersimpan tidak berubah.";
}

export function ImportControl({ initialJob }: { initialJob: ImportJob | null }) {
  const router = useRouter();
  const [job, setJob] = useState(initialJob);
  const [error, setError] = useState("");
  const [pollRound, setPollRound] = useState(0);
  const [pending, startTransition] = useTransition();
  const active = isActiveJob(job);

  useEffect(() => {
    if (!job || !isActiveJob(job)) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await getOsmImportJob(job.id);
      if (cancelled) return;
      if (!result.ok) {
        setError(`Status impor belum bisa diperbarui. ${result.message}`);
        setPollRound((round) => round + 1);
        return;
      }
      setError("");
      setJob(result.data);
      // Muat ulang riwayat, notifikasi, dan daftar tempat setelah job selesai.
      if (!isActiveJob(result.data)) router.refresh();
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [job, pollRound, router]);

  function start() {
    setError("");
    startTransition(async () => {
      const result = await startOsmImport();
      if (!result.ok) {
        setError(result.message);
        if (result.status === 409) router.refresh();
        return;
      }
      setJob(result.data);
    });
  }

  const meta = job ? jobStatusMeta[job.status] : null;
  const skipped = Object.entries(job?.skipBreakdown ?? {}).filter(([, count]) => (count ?? 0) > 0);

  return (
    <section className="status-card" aria-labelledby="osm-status-title">
      <div className="status-heading">
        <div>
          <p className="small muted">STATUS IMPOR</p>
          <h2 id="osm-status-title">Impor terakhir</h2>
        </div>
        {meta && <span className={meta.badge}>{meta.label}</span>}
      </div>

      <p role="status">{statusSentence(job)}</p>

      {job && (
        <dl className="osm-stats">
          <div><dt>Mulai</dt><dd>{formatWib(job.startedAt ?? job.createdAt)}</dd></div>
          <div><dt>Selesai</dt><dd>{formatWib(job.finishedAt)}</dd></div>
          <div><dt>Diambil</dt><dd>{job.fetchedCount}</dd></div>
          <div><dt>Baru</dt><dd>{job.createdCount}</dd></div>
          <div><dt>Diperbarui</dt><dd>{job.updatedCount}</dd></div>
          <div><dt>Tidak berubah</dt><dd>{job.unchangedCount}</dd></div>
          <div><dt>Dilewati</dt><dd>{job.skippedCount}</dd></div>
          <div><dt>Wilayah</dt><dd>{job.area}</dd></div>
        </dl>
      )}

      {job?.status === "failed" && job.errorMessage && <p className="error">{job.errorMessage}</p>}

      {skipped.length > 0 && (
        <details className="osm-details">
          <summary className="text-button">Lihat alasan data dilewati</summary>
          <ul>
            {skipped.map(([reason, count]) => (
              <li key={reason}>{skipReasonLabels[reason] ?? reason}: {count}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="osm-actions">
        <button type="button" className="button primary" disabled={pending || active} onClick={start}
          aria-describedby="osm-import-hint">
          {active ? "Impor sedang berjalan…" : pending ? "Memulai impor…" : "Jalankan impor OSM"}
        </button>
        <p id="osm-import-hint" className="small muted">
          Mengambil rumah sakit, sekolah, stasiun, taman, mal, dan fasilitas publik lain di DKI Jakarta.
          Proses bisa memakan waktu beberapa menit.
        </p>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
