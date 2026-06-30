export type Coordinates = {
  lat: number;
  lon: number;
  label: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
};

const geocodeCache = new Map<string, Coordinates | null>();

const providerHeaders = {
  "user-agent": "LeadGenPipeline/0.1 local prospect research",
  accept: "application/json"
};

export async function geocodeLocation(location: string): Promise<Coordinates | null> {
  const key = location.trim().toLowerCase();
  if (!key) return null;
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;

  const params = new URLSearchParams({
    q: location,
    format: "jsonv2",
    limit: "1"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: providerHeaders,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("OpenStreetMap location lookup failed.");
  }

  const results = (await response.json()) as NominatimResult[];
  const first = results[0];
  if (!first) {
    geocodeCache.set(key, null);
    return null;
  }

  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    geocodeCache.set(key, null);
    return null;
  }

  const coordinates = {
    lat,
    lon,
    label: first.display_name ?? location
  };

  geocodeCache.set(key, coordinates);
  return coordinates;
}
