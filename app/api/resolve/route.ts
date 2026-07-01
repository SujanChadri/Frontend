import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const base = process.env.NEXT_PUBLIC_EXTRACTOR_URL;
  if (!url) return NextResponse.json({ ok: false, fallback: true, error: "Link Invalid or Expired" });
  if (!base) return NextResponse.json({ ok: false, fallback: true, error: "Extractor not configured (set NEXT_PUBLIC_EXTRACTOR_URL)" });

  try {
    const r = await fetch(`${base.replace(/\/$/, "")}/extract?url=${encodeURIComponent(url)}`, {
      cache: "no-store",
    });
    const data = await r.json().catch(() => null);
    if (!r.ok || !data?.ok || !data?.stream) {
      return NextResponse.json({ ok: false, fallback: true, error: "Link Invalid or Expired" });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ ok: false, fallback: true, error: "Link Invalid or Expired" });
  }
}
