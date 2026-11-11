"use client";

/*!
 * Adapted from mapcn (https://www.mapcn.dev/), Copyright (c) 2025 Anmoldeep Singh.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { LocateFixed, Minus, Plus } from "lucide-react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";

const streetStyle = "https://tiles.openfreemap.org/styles/bright";

type LocationStatus =
  | { state: "idle" | "locating" | "located" }
  | { state: "error"; message: string };

export function Map({
  center: [longitude, latitude],
  zoom,
  label,
}: {
  center: [number, number];
  zoom: number;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const locationMarkerRef = useRef<Marker | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [location, setLocation] = useState<LocationStatus>({ state: "idle" });

  useEffect(() => {
    let cancelled = false;

    import("maplibre-gl").then((lib) => {
      if (cancelled || !containerRef.current) return;

      if (!lib.getWorkerUrl()) {
        lib.setWorkerUrl(
          `https://unpkg.com/maplibre-gl@${lib.getVersion()}/dist/maplibre-gl-worker.mjs`,
        );
      }

      const map = new lib.Map({
        container: containerRef.current,
        style: streetStyle,
        center: [longitude, latitude],
        zoom,
        renderWorldCopies: false,
        attributionControl: { compact: false },
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        locale: {
          "Map.Title": label,
        },
      });
      mapRef.current = map;
      if (!map.painter) throw new lib.GPUInitializationError({}, null);
      map.touchZoomRotate.disableRotation();

      const dot = document.createElement("div");
      dot.className = "mapcn-user-location";
      dot.setAttribute("role", "img");
      dot.setAttribute("aria-label", "Posisi saya pada peta");
      locationMarkerRef.current = new lib.Marker({ element: dot });

      map.once("load", () => setStatus("ready"));
      map.on("error", () => {
        setStatus((current) => current === "ready" ? current : "error");
      });
    }).catch(() => {
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      locationMarkerRef.current?.remove();
      locationMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [attempt, label, latitude, longitude, zoom]);

  function locateUser() {
    const map = mapRef.current;
    const marker = locationMarkerRef.current;
    if (!map || !marker || location.state === "locating") return;

    if (!window.isSecureContext) {
      setLocation({ state: "error", message: "Buka situs lewat HTTPS untuk memakai lokasi." });
      return;
    }
    if (!navigator.geolocation) {
      setLocation({ state: "error", message: "Browser ini tidak mendukung akses lokasi." });
      return;
    }

    setLocation({ state: "locating" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (mapRef.current !== map) return;
        const center: [number, number] = [coords.longitude, coords.latitude];
        marker.setLngLat(center).addTo(map);
        map.flyTo({ center, zoom: Math.max(map.getZoom(), 16), duration: 800 });
        setLocation({ state: "located" });
      },
      (error) => {
        if (mapRef.current !== map) return;
        let message = "Lokasi belum terdeteksi. Aktifkan layanan lokasi, lalu coba lagi.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Izinkan akses lokasi di pengaturan situs pada browser, lalu coba lagi.";
        } else if (error.code === error.TIMEOUT) {
          message = "Pencarian lokasi terlalu lama. Coba lagi.";
        }
        setLocation({ state: "error", message });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
  }

  return (
    <>
      <div className="mapcn-canvas" ref={containerRef} inert={status !== "ready"} />
      {status === "loading" && <p className="mapcn-message muted" role="status">Memuat peta…</p>}
      {status === "error" && (
        <div className="mapcn-message">
          <p role="alert">Peta belum dapat dimuat.</p>
          <button className="button secondary" type="button" onClick={() => {
            setStatus("loading");
            setAttempt((current) => current + 1);
          }}>Coba lagi</button>
        </div>
      )}
      {status === "ready" && (
        <>
          <div className="mapcn-controls" role="group" aria-label="Kontrol peta">
            <button type="button" aria-label="Lokasi saya" title="Lokasi saya"
              aria-disabled={location.state === "locating"} onClick={locateUser}>
              <LocateFixed size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Perbesar peta" onClick={() => mapRef.current?.zoomIn({ duration: 300 })}>
              <Plus size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Perkecil peta" onClick={() => mapRef.current?.zoomOut({ duration: 300 })}>
              <Minus size={18} aria-hidden="true" />
            </button>
          </div>
          <p className={location.state === "locating" ? "mapcn-location-feedback" : "mapcn-location-announcement"} role="status">
            {location.state === "locating" && "Mencari lokasi…"}
            {location.state === "located" && "Peta dipusatkan ke lokasi kamu."}
          </p>
          {location.state === "error" && (
            <p className="mapcn-location-feedback error" role="alert">{location.message}</p>
          )}
        </>
      )}
    </>
  );
}
