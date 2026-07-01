import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const base = process.env.NEXT_PUBLIC_EXTRACTOR_URL;
  if (!url) return NextResponse.json({ ok: false, error: "Missing url" }, { status: 400 });
  if (!base) return NextResponse.json({ ok: false, error: "Extractor not configured" }, { status: 500 });

  try {
    const r = await fetch(`${base.replace(/\/$/, "")}/extract?url=${encodeURIComponent(url)}`, {
      cache: "no-store",
    });
    const data = await r.json().catch(() => null);
    if (!r.ok || !data?.ok || !data?.stream) {
      return NextResponse.json({ ok: false, error: "Link Invalid or Expired" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ ok: false, error: "Link Invalid or Expired" }, { status: 502 });
  }
}
