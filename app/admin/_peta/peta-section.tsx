import { adminAccessToken, adminApi } from "../_impor-osm/backend";
import { ManualPlaceManagement, type PlaceItemData } from "./manual-place-section";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function PetaSection({ searchParams }: { searchParams: SearchParams }) {
  const token = await adminAccessToken();

  const q = readParam(searchParams, "q").slice(0, 100);
  const status = readParam(searchParams, "status");
  const category = readParam(searchParams, "category");
  const pageNum = Number(readParam(searchParams, "page"));
  const page = Number.isInteger(pageNum) && pageNum > 0 ? pageNum : 1;
  const pageSize = 10;

  // Query database real via backend API
  const placeQuery = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    source: "manual",
  });
  if (q) placeQuery.set("q", q);
  if (status) placeQuery.set("status", status);
  if (category) placeQuery.set("category", category);

  const [statsRes, placesRes] = await Promise.all([
    adminApi<{ total: number; accessible: number; partial: number; unknown: number }>(
      "/api/admin/places/stats?source=manual",
      token
    ),
    adminApi<{
      items: PlaceItemData[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/admin/places?${placeQuery.toString()}`, token),
  ]);

  const stats = statsRes.ok
    ? statsRes.data
    : { total: 0, accessible: 0, partial: 0, unknown: 0 };

  const places = placesRes.ok ? placesRes.data.items : [];
  const totalPlaces = placesRes.ok ? placesRes.data.total : 0;

  return (
    <ManualPlaceManagement
      stats={stats}
      places={places}
      totalPlaces={totalPlaces}
      page={page}
      pageSize={pageSize}
      q={q}
      status={status}
      category={category}
    />
  );
}
