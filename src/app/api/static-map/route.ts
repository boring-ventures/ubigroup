import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Simple proxy for OpenStreetMap static map images to enable same-origin rendering in html2canvas
// Validates inputs and applies sane limits

function parseCenter(
  value: string | null
): { lat: number; lng: number } | null {
  if (!value) return null;
  const parts = value.split(",");
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function parseZoom(value: string | null): number {
  const z = Number(value);
  if (!Number.isFinite(z)) return 15;
  return Math.max(1, Math.min(19, Math.round(z)));
}

function parseSize(value: string | null): { width: number; height: number } {
  if (!value) return { width: 800, height: 400 };
  const match = value.match(/^(\d+)x(\d+)$/);
  if (!match) return { width: 800, height: 400 };
  let width = Number(match[1]);
  let height = Number(match[2]);
  // Enforce reasonable bounds
  width = Math.max(100, Math.min(1200, width));
  height = Math.max(100, Math.min(1200, height));
  return { width, height };
}

function sanitizeMarkers(value: string | null): string | null {
  if (!value) return null;
  // Expect format: lat,lng,color — validate lat/lng and allow simple color token
  const parts = value.split(",");
  if (parts.length < 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const color = parts[2] ? encodeURIComponent(parts[2]) : "red";
  return `${lat},${lng},${color}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const centerRaw = searchParams.get("center");
    const zoomRaw = searchParams.get("zoom");
    const sizeRaw = searchParams.get("size");
    const markersRaw = searchParams.get("markers");

    const center = parseCenter(centerRaw);
    if (!center) {
      return new Response("Invalid center", { status: 400 });
    }
    const zoom = parseZoom(zoomRaw);
    const { width, height } = parseSize(sizeRaw);
    const markers = sanitizeMarkers(markersRaw);

    const upstreamUrl = new URL(
      "https://staticmap.openstreetmap.de/staticmap.php"
    );
    upstreamUrl.searchParams.set("center", `${center.lat},${center.lng}`);
    upstreamUrl.searchParams.set("zoom", String(zoom));
    upstreamUrl.searchParams.set("size", `${width}x${height}`);
    if (markers) upstreamUrl.searchParams.set("markers", markers);

    const upstream = await fetch(upstreamUrl.toString(), {
      headers: {
        // Some providers require UA
        "User-Agent": "UbiGroup/1.0 (+https://example.com)",
      },
    });
    if (!upstream.ok) {
      return new Response("Failed to fetch map", { status: 502 });
    }
    const arrayBuffer = await upstream.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "image/png",
        "Cache-Control": "public, max-age=3600, immutable",
        // Same-origin, but allow embedding across origins if needed
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("Unexpected error", { status: 500 });
  }
}
