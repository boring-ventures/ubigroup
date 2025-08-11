import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ z: string; x: string; y: string }> }
) {
  try {
    const { z, x, y } = await ctx.params;
    // y can come as "123.png"; strip extension
    const yNum = y.replace(/\.png$/i, "");

    // Basic validation
    const zNum = Number(z);
    const xNum = Number(x);
    const yNumInt = Number(yNum);
    if (
      !Number.isFinite(zNum) ||
      !Number.isFinite(xNum) ||
      !Number.isFinite(yNumInt)
    ) {
      return new Response("Invalid tile coords", { status: 400 });
    }

    const upstreamUrl = `https://a.tile.openstreetmap.org/${zNum}/${xNum}/${yNumInt}.png`;
    const upstream = await fetch(upstreamUrl, {
      headers: {
        "User-Agent": "UbiGroup/1.0 (+https://ubigroup.example)",
      },
    });
    if (!upstream.ok) {
      return new Response("Upstream tile error", { status: upstream.status });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=604800, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response("Unexpected error", { status: 500 });
  }
}
