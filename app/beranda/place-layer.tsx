"use client";

import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { Map } from "@/components/ui/map";
import {
  accessibilityAttributeKeys,
  accessibilityStatusMeta,
  attributeLabels,
  attributeValueLabel,
  osmUrl,
  type AccessibilityAttributes,
  type AccessibilityStatus,
} from "@/lib/accessibility";
import "./place-layer.css";

type PublicPlace = {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  accessibilityStatus: AccessibilityStatus;
  accessibilityAttributes: AccessibilityAttributes;
  dataSource: "manual" | "osm";
  osmType: string | null;
  osmId: number | null;
};

const SOURCE_ID = "aksesin-places";
const LAYER_ID = "aksesin-places-icons";
const SELECTED_LAYER_ID = "aksesin-places-selected";
const LIST_LIMIT = 50;

// Bentuk ikon ikut membedakan status supaya informasi tidak bergantung pada warna saja.
const statusStyle: Record<AccessibilityStatus, { color: string; glyph: string; glyphColor: string }> = {
  accessible: { color: "#087c53", glyph: "✓", glyphColor: "#ffffff" },
  partial: { color: "#f2c230", glyph: "!", glyphColor: "#3d2a00" },
  unknown: { color: "#6b7780", glyph: "?", glyphColor: "#ffffff" },
};
const statusOrder: AccessibilityStatus[] = ["accessible", "partial", "unknown"];

function statusIcon({ color, glyph, glyphColor }: (typeof statusStyle)[AccessibilityStatus]) {
  const size = 56;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.beginPath();
  context.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
  context.lineWidth = 6;
  context.strokeStyle = "#ffffff";
  context.stroke();
  context.fillStyle = glyphColor;
  context.font = "bold 30px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(glyph, size / 2, size / 2 + 2);
  return context.getImageData(0, 0, size, size);
}

function describe(place: PublicPlace) {
  return [place.category, place.address].filter(Boolean).join(" · ");
}

function PlaceLayer({ map }: { map: MapLibreMap }) {
  const [places, setPlaces] = useState<PublicPlace[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [truncated, setTruncated] = useState(false);
  const [selected, setSelected] = useState<PublicPlace | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const cardHeadingRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    for (const status of statusOrder) {
      const id = `aksesin-status-${status}`;
      const image = statusIcon(statusStyle[status]);
      if (image && !map.hasImage(id)) map.addImage(id, image, { pixelRatio: 2 });
    }
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    }
    if (!map.getLayer(SELECTED_LAYER_ID)) {
      map.addLayer({
        id: SELECTED_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        filter: ["==", ["get", "id"], ""],
        paint: { "circle-radius": 20, "circle-color": "rgba(23, 103, 210, 0.2)", "circle-stroke-color": "#1767d2", "circle-stroke-width": 2 },
      });
    }
    if (!map.getLayer(LAYER_ID)) {
      map.addLayer({
        id: LAYER_ID,
        type: "symbol",
        source: SOURCE_ID,
        layout: {
          "icon-image": ["concat", "aksesin-status-", ["get", "status"]],
          "icon-allow-overlap": true,
          "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.6, 15, 1],
        },
      });
    }

    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let loaded: PublicPlace[] = [];

    async function load() {
      controller?.abort();
      controller = new AbortController();
      const bounds = map.getBounds();
      const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
        .map((value) => value.toFixed(5)).join(",");
      try {
        const response = await fetch(`/api/places?bbox=${bbox}`, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok || !body?.data) throw new Error("PLACES_UNAVAILABLE");
        loaded = body.data.items as PublicPlace[];
        const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
        source?.setData({
          type: "FeatureCollection",
          features: loaded.map((place) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [place.longitude, place.latitude] },
            properties: { id: place.id, status: place.accessibilityStatus },
          })),
        });
        setPlaces(loaded);
        setTruncated(Boolean(body.data.truncated));
        setState("ready");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setState("error");
      }
    }

    function scheduleLoad() {
      clearTimeout(timer);
      setState("loading");
      timer = setTimeout(load, 300);
    }

    function select(event: MapLayerMouseEvent) {
      const id = event.features?.[0]?.properties?.id;
      const place = loaded.find((item) => item.id === id);
      if (!place) return;
      returnFocusRef.current = null;
      setSelected(place);
    }
    const pointer = () => { map.getCanvas().style.cursor = "pointer"; };
    const resetPointer = () => { map.getCanvas().style.cursor = ""; };

    map.on("moveend", scheduleLoad);
    map.on("click", LAYER_ID, select);
    map.on("mouseenter", LAYER_ID, pointer);
    map.on("mouseleave", LAYER_ID, resetPointer);
    void load();

    return () => {
      clearTimeout(timer);
      controller?.abort();
      map.off("moveend", scheduleLoad);
      map.off("click", LAYER_ID, select);
      map.off("mouseenter", LAYER_ID, pointer);
      map.off("mouseleave", LAYER_ID, resetPointer);
      // Peta bisa sudah dihapus lebih dulu oleh komponen induk.
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getLayer(SELECTED_LAYER_ID)) map.removeLayer(SELECTED_LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch {
        // Tidak ada yang perlu dibersihkan.
      }
    };
  }, [map, reloadKey]);

  useEffect(() => {
    if (map.getLayer(SELECTED_LAYER_ID)) map.setFilter(SELECTED_LAYER_ID, ["==", ["get", "id"], selected?.id ?? ""]);
    if (selected) {
      cardHeadingRef.current?.focus();
    } else if (returnFocusRef.current) {
      // Dijalankan setelah render karena di layar kecil panel daftar baru tampil lagi saat kartu ditutup.
      returnFocusRef.current.focus();
      returnFocusRef.current = null;
    }
  }, [map, selected]);

  function openFromList(place: PublicPlace, trigger: HTMLElement) {
    returnFocusRef.current = trigger;
    setSelected(place);
    map.easeTo({ center: [place.longitude, place.latitude], zoom: Math.max(map.getZoom(), 16), duration: 600 });
  }

  function closeCard() {
    setSelected(null);
  }

  const counts = statusOrder.map((status) => ({ status, total: places.filter((place) => place.accessibilityStatus === status).length }));
  const link = selected ? osmUrl(selected) : null;
  const attributes = selected ? accessibilityAttributeKeys.filter((key) => selected.accessibilityAttributes[key]) : [];

  return (
    <>
      <section className="places-panel" aria-label="Legenda dan daftar tempat">
        <h2 className="places-panel-title">Status aksesibilitas</h2>
        <ul className="places-legend">
          {counts.map(({ status, total }) => (
            <li key={status}>
              <span className={`places-legend-icon ${status}`} aria-hidden="true">{statusStyle[status].glyph}</span>
              <span>{accessibilityStatusMeta[status].label}</span>
              <span className="places-legend-count">{total}</span>
            </li>
          ))}
        </ul>
        <p className="places-panel-status small" role="status">
          {state === "loading" && "Memuat tempat…"}
          {state === "ready" && (places.length
            ? `${places.length} tempat di area ini.${truncated ? " Perbesar peta untuk melihat semua tempat." : ""}`
            : "Belum ada data tempat di area ini.")}
        </p>
        {state === "error" && (
          <div className="places-panel-error">
            <p className="error small" role="alert">Data tempat belum bisa dimuat.</p>
            <button type="button" className="text-button" onClick={() => {
              setState("loading");
              setReloadKey((key) => key + 1);
            }}>Muat ulang tempat</button>
          </div>
        )}
        {places.length > 0 && (
          <details className="places-list">
            <summary className="text-button">Daftar tempat di area ini</summary>
            <ul>
              {places.slice(0, LIST_LIMIT).map((place) => (
                <li key={place.id}>
                  <button type="button" onClick={(event) => openFromList(place, event.currentTarget)}>
                    <span className="places-list-name">{place.name}</span>
                    <span className="small muted">{accessibilityStatusMeta[place.accessibilityStatus].label}</span>
                  </button>
                </li>
              ))}
            </ul>
            {places.length > LIST_LIMIT && <p className="small muted">Menampilkan {LIST_LIMIT} tempat pertama.</p>}
          </details>
        )}
        <p className="places-attribution small muted">
          Data tempat ©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">kontributor OpenStreetMap</a>
        </p>
      </section>

      {selected && (
        <section className="place-card" aria-labelledby="place-card-title"
          onKeyDown={(event) => { if (event.key === "Escape") closeCard(); }}>
          <div className="place-card-head">
            <h2 id="place-card-title" ref={cardHeadingRef} tabIndex={-1}>{selected.name}</h2>
            <button type="button" className="text-button" onClick={closeCard}>Tutup<span className="places-visually-hidden"> detail {selected.name}</span></button>
          </div>
          {describe(selected) && <p className="small muted">{describe(selected)}</p>}
          <p>
            <span className={`places-legend-icon ${selected.accessibilityStatus}`} aria-hidden="true">
              {statusStyle[selected.accessibilityStatus].glyph}
            </span>{" "}
            <strong>{accessibilityStatusMeta[selected.accessibilityStatus].label}</strong>
          </p>
          {attributes.length ? (
            <dl className="place-card-attributes">
              {attributes.map((key) => (
                <div key={key}>
                  <dt>{attributeLabels[key]}</dt>
                  <dd>{attributeValueLabel(selected.accessibilityAttributes[key]!)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="small">Belum ada informasi fasilitas aksesibilitas.</p>
          )}
          <p className="small muted">
            Sumber: {selected.dataSource === "osm" ? "OpenStreetMap" : "Data Aksesin"}. Kondisi tempat bisa berubah,
            pastikan kembali sebelum berkunjung.
          </p>
          {link && (
            <a className="place-card-link small" href={link} target="_blank" rel="noopener noreferrer">
              Lihat di OpenStreetMap<span className="places-visually-hidden"> (membuka tab baru)</span>
            </a>
          )}
        </section>
      )}
    </>
  );
}

export function AccessibilityMap(props: { center: [number, number]; zoom: number; label: string }) {
  return <Map {...props}>{(map) => <PlaceLayer map={map} />}</Map>;
}
