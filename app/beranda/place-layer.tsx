"use client";

import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
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
import { ActionForm } from "../_components/action-form";
import { addSavedPlace } from "../lokasi-tersimpan/place-actions";

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

function PlaceLayer({ map, savedPlaceIds }: { map: MapLibreMap; savedPlaceIds: string[] }) {
  const [places, setPlaces] = useState<PublicPlace[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [truncated, setTruncated] = useState(false);
  const [selected, setSelected] = useState<PublicPlace | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const cardHeadingRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const loadedPlacesRef = useRef<PublicPlace[]>([]);
  const selectedRef = useRef<PublicPlace | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // Sinkronisasi data GeoJSON source pada peta
  const updateMapSource = useCallback((items: PublicPlace[]) => {
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData({
      type: "FeatureCollection",
      features: items.map((place) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [place.longitude, place.latitude] },
        properties: { id: place.id, status: place.accessibilityStatus },
      })),
    });
  }, [map]);

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
        let loaded = body.data.items as PublicPlace[];

        // Pertahankan tempat yang sedang dipilih agar markernya tidak hilang saat kamera bergeser
        const curSelected = selectedRef.current;
        if (curSelected && !loaded.some((item) => item.id === curSelected.id)) {
          loaded = [curSelected, ...loaded];
        }

        loadedPlacesRef.current = loaded;
        updateMapSource(loaded);
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
      const place = loadedPlacesRef.current.find((item) => item.id === id);
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
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getLayer(SELECTED_LAYER_ID)) map.removeLayer(SELECTED_LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch {
        // Abaikan jika sudah dibersihkan
      }
    };
  }, [map, reloadKey, updateMapSource]);

  useEffect(() => {
    if (map.getLayer(SELECTED_LAYER_ID)) {
      map.setFilter(SELECTED_LAYER_ID, ["==", ["get", "id"], selected?.id ?? ""]);
    }
    if (selected) {
      cardHeadingRef.current?.focus();
    } else if (returnFocusRef.current) {
      returnFocusRef.current.focus();
      returnFocusRef.current = null;
    }
  }, [map, selected]);

  // Handle click outside dropdown pencarian
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setIsDropdownOpen(true);
    const trimmed = value.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      setHasSearched(false);
    }
  }

  // Debounced search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);
      try {
        const response = await fetch(`/api/places/search?q=${encodeURIComponent(trimmed)}&limit=15`, {
          signal: controller.signal,
        });
        const body = await response.json();
        if (response.ok && body?.data?.items) {
          setSearchResults(body.data.items as PublicPlace[]);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  function handleSelectPlace(place: PublicPlace) {
    setSearchQuery(place.name);
    setIsDropdownOpen(false);

    // Pastikan tempat masuk ke data GeoJSON agar markernya langsung muncul seketika
    if (!loadedPlacesRef.current.some((item) => item.id === place.id)) {
      const merged = [place, ...loadedPlacesRef.current];
      loadedPlacesRef.current = merged;
      setPlaces(merged);
      updateMapSource(merged);
    }

    setSelected(place);

    // Animasi kamera peta ke lokasi tempat dan perbesar zoom
    map.flyTo({
      center: [place.longitude, place.latitude],
      zoom: Math.max(map.getZoom(), 16),
      duration: 800,
    });
  }

  function handleClearSearch() {
    setSearchQuery("");
    setSearchResults([]);
    setIsDropdownOpen(false);
    setHasSearched(false);
    searchInputRef.current?.focus();
  }

  function openFromList(place: PublicPlace, trigger: HTMLElement) {
    returnFocusRef.current = trigger;
    setSelected(place);
    map.easeTo({ center: [place.longitude, place.latitude], zoom: Math.max(map.getZoom(), 16), duration: 600 });
  }

  function closeCard() {
    setSelected(null);
  }

  const counts = statusOrder.map((status) => ({
    status,
    total: places.filter((place) => place.accessibilityStatus === status).length,
  }));
  const link = selected ? osmUrl(selected) : null;
  const attributes = selected ? accessibilityAttributeKeys.filter((key) => selected.accessibilityAttributes[key]) : [];

  return (
    <>
      {/* Floating Search Bar (Google Maps Style) */}
      <div className="place-search-container" ref={searchContainerRef}>
        <div className="place-search-input-box">
          <Search size={18} className="place-search-icon" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            className="place-search-input"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setIsDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsDropdownOpen(false);
              } else if (e.key === "Enter" && searchResults.length > 0 && isDropdownOpen) {
                handleSelectPlace(searchResults[0]);
              }
            }}
            placeholder="Cari tempat, alamat, atau kategori..."
            aria-label="Cari tempat di peta"
            role="combobox"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            aria-controls="place-search-results"
          />
          {isSearching ? (
            <Loader2 size={16} className="place-search-spinner" aria-label="Mencari tempat..." />
          ) : searchQuery ? (
            <button
              type="button"
              className="place-search-clear-btn"
              onClick={handleClearSearch}
              aria-label="Hapus kata kunci pencarian"
              title="Hapus pencarian"
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {/* Dropdown Hasil Pencarian */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div id="place-search-results" className="place-search-dropdown" role="listbox">
            {isSearching && searchResults.length === 0 ? (
              <div className="place-search-loading">
                <Loader2 size={18} className="place-search-spinner" />
                <span>Mencari lokasi di Jakarta…</span>
              </div>
            ) : searchResults.length === 0 && hasSearched ? (
              <div className="place-search-empty" role="status">
                <p className="place-search-empty-title">Tempat tidak ditemukan</p>
                <p className="small muted">Coba cari dengan nama tempat, jalan, atau kategori lain.</p>
              </div>
            ) : (
              <ul className="place-search-list">
                {searchResults.map((place) => (
                  <li key={place.id} role="option" aria-selected={selected?.id === place.id}>
                    <button
                      type="button"
                      className="place-search-item-btn"
                      onClick={() => handleSelectPlace(place)}
                    >
                      <div className="place-search-item-info">
                        <div className="place-search-item-header">
                          <span className="place-search-item-name">{place.name}</span>
                          <span className={`place-search-badge ${place.dataSource}`}>
                            {place.dataSource === "manual" ? "Manual" : "OSM"}
                          </span>
                        </div>
                        <p className="place-search-item-sub small muted">
                          {[place.category, place.address].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="place-search-item-status-wrapper">
                        <span
                          className={`places-legend-icon ${place.accessibilityStatus}`}
                          aria-hidden="true"
                          title={accessibilityStatusMeta[place.accessibilityStatus].label}
                        >
                          {statusStyle[place.accessibilityStatus].glyph}
                        </span>
                        <span className="place-search-status-text small">
                          {accessibilityStatusMeta[place.accessibilityStatus].label}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Legenda & Daftar Tempat Area Peta */}
      <section className="places-panel" aria-label="Legenda dan daftar tempat">
        <h2 className="places-panel-title">Status aksesibilitas</h2>
        <ul className="places-legend">
          {counts.map(({ status, total }) => (
            <li key={status}>
              <span className={`places-legend-icon ${status}`} aria-hidden="true">
                {statusStyle[status].glyph}
              </span>
              <span>{accessibilityStatusMeta[status].label}</span>
              <span className="places-legend-count">{total}</span>
            </li>
          ))}
        </ul>
        <p className="places-panel-status small" role="status">
          {state === "loading" && "Memuat tempat…"}
          {state === "ready" &&
            (places.length
              ? `${places.length} tempat di area ini.${truncated ? " Perbesar peta untuk melihat semua tempat." : ""}`
              : "Belum ada data tempat di area ini.")}
        </p>
        {state === "error" && (
          <div className="places-panel-error">
            <p className="error small" role="alert">
              Data tempat belum bisa dimuat.
            </p>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setState("loading");
                setReloadKey((key) => key + 1);
              }}
            >
              Muat ulang tempat
            </button>
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
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            kontributor OpenStreetMap
          </a>
        </p>
      </section>

      {/* Preview Card Tempat yang Dipilih */}
      {selected && (
        <section
          className="place-card"
          aria-labelledby="place-card-title"
          onKeyDown={(event) => {
            if (event.key === "Escape") closeCard();
          }}
        >
          <div className="place-card-head">
            <div className="place-card-title-group">
              <h2 id="place-card-title" ref={cardHeadingRef} tabIndex={-1}>
                {selected.name}
              </h2>
              <span className={`place-search-badge ${selected.dataSource}`}>
                {selected.dataSource === "manual" ? "Manual" : "OSM"}
              </span>
            </div>
            <button type="button" className="text-button" onClick={closeCard}>
              Tutup<span className="places-visually-hidden"> detail {selected.name}</span>
            </button>
          </div>

          {savedPlaceIds.includes(selected.id) ? (
            <div className="place-card-save">
              <p className="small" role="status">Lokasi tersimpan.</p>
              <Link className="place-card-link small" href="/lokasi-tersimpan">Kelola lokasi tersimpan</Link>
            </div>
          ) : (
            <ActionForm key={selected.id} className="place-card-save" action={() => addSavedPlace(selected.id)}>
              {(pending, error) => (
                <>
                  <button type="submit" className="button primary" disabled={pending}>
                    {pending ? "Menyimpan…" : "Simpan lokasi"}
                  </button>
                  {error && <p className="error small" role="alert">{error}</p>}
                </>
              )}
            </ActionForm>
          )}

          <div className="place-card-meta-list small">
            {selected.category && (
              <p>
                <span className="muted">Kategori: </span>
                <strong>{selected.category}</strong>
              </p>
            )}
            {selected.address && (
              <p>
                <span className="muted">Alamat: </span>
                <span>{selected.address}</span>
              </p>
            )}
          </div>

          <div className="place-card-status-row">
            <span className={`places-legend-icon ${selected.accessibilityStatus}`} aria-hidden="true">
              {statusStyle[selected.accessibilityStatus].glyph}
            </span>{" "}
            <strong>{accessibilityStatusMeta[selected.accessibilityStatus].label}</strong>
          </div>

          <div className="place-card-facilities">
            <h3 className="place-card-facilities-title small">Fasilitas Aksesibilitas</h3>
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
              <p className="small muted">Belum ada informasi fasilitas aksesibilitas spesifik.</p>
            )}
          </div>

          <p className="small muted">
            Sumber: {selected.dataSource === "manual" ? "Manual (Admin Aksesin)" : "OpenStreetMap"}. Kondisi tempat bisa berubah,
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

export function AccessibilityMap({ savedPlaceIds, ...props }: { center: [number, number]; zoom: number; label: string; savedPlaceIds: string[] }) {
  return <Map {...props}>{(map) => <PlaceLayer map={map} savedPlaceIds={savedPlaceIds} />}</Map>;
}
