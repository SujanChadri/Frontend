"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Resolved = { ok: true; stream: string; filename?: string; contentType?: string } | { ok: false; error: string };

export default function Watch() {
  const params = useSearchParams();
  const url = params.get("url") || "";
  const [state, setState] = useState<Resolved | null>(null);

  useEffect(() => {
    if (!url) { setState({ ok: false, error: "Link Invalid or Expired" }); return; }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/resolve?url=${encodeURIComponent(url)}`, { cache: "no-store" });
        const data = await r.json();
        if (!cancelled) setState(data);
      } catch {
        if (!cancelled) setState({ ok: false, error: "Link Invalid or Expired" });
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  if (!state) {
    return <Centered><div>Resolving link…</div></Centered>;
  }

  if (!state.ok) {
    return (
      <Centered>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#ff6b6b" }}>Link Invalid or Expired</div>
          <div style={{ marginTop: 8, opacity: 0.7, fontSize: 14 }}>The backend could not resolve a stream for this URL.</div>
          <a href="/" style={{ display: "inline-block", marginTop: 20, color: "#8ab4ff" }}>← Try another link</a>
        </div>
      </Centered>
    );
  }

  const isHls = /\.m3u8(\?|$)/i.test(state.stream);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <a href="/" style={{ color: "#8ab4ff", fontSize: 14 }}>← Back</a>
      <h2 style={{ margin: "12px 0 16px", fontSize: 18, wordBreak: "break-all" }}>{state.filename || "Stream"}</h2>
      <div style={{ background: "#000", borderRadius: 12, overflow: "hidden" }}>
        {isHls ? (
          <HlsPlayer src={state.stream} />
        ) : (
          <video src={state.stream} controls autoPlay style={{ width: "100%", display: "block", maxHeight: "80vh" }} />
        )}
      </div>
      <div style={{ marginTop: 12, fontSize: 13, opacity: 0.7, wordBreak: "break-all" }}>Source: {state.stream}</div>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>{children}</div>;
}

function HlsPlayer({ src }: { src: string }) {
  useEffect(() => {
    const video = document.getElementById("hls-video") as HTMLVideoElement | null;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) { video.src = src; return; }
    // dynamic load hls.js from CDN to keep deps minimal
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/hls.js@1";
    s.onload = () => {
      // @ts-expect-error global
      const Hls = window.Hls;
      if (Hls?.isSupported()) {
        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        video.src = src;
      }
    };
    document.body.appendChild(s);
    return () => { s.remove(); };
  }, [src]);
  return <video id="hls-video" controls autoPlay style={{ width: "100%", display: "block", maxHeight: "80vh" }} />;
}
