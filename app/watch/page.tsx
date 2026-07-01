"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Resolved = { ok: true; stream: string; filename?: string; contentType?: string } | { ok: false; error: string };

export default function WatchPage() {
  return (
    <Suspense fallback={<Centered><div>Loading…</div></Centered>}>
      <Watch />
    </Suspense>
  );
}

function Watch() {
  const params = useSearchParams();
  const url = params.get("url") || "";
  const [state, setState] = useState<Resolved | null>(null);

  useEffect(() => {
    if (!url) { setState({ ok: false, error: "Link Invalid or Expired" }); return; }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/resolve?url=${encodeURIComponent(url)}`, { cache: "no-store" });
        const data = await r.json().catch(() => null);
        if (cancelled) return;
        if (!data || data.ok !== true || !data.stream) {
          setState({ ok: false, error: "Link Invalid or Expired" });
        } else {
          setState(data);
        }
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
          <Mp4Player src={state.stream} />
        )}
      </div>
      <div style={{ marginTop: 12, fontSize: 13, opacity: 0.7, wordBreak: "break-all" }}>Source: {state.stream}</div>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>{children}</div>;
}

const VIDEO_STYLE: React.CSSProperties = {
  width: "100%",
  display: "block",
  maxHeight: "80vh",
  background: "#000",
};

function Mp4Player({ src }: { src: string }) {
  const [err, setErr] = useState<string | null>(null);
  return (
    <div style={{ position: "relative" }}>
      <video
        src={src}
        controls
        autoPlay
        playsInline
        controlsList="nodownload"
        crossOrigin="anonymous"
        style={VIDEO_STYLE}
        onError={() => setErr("Playback failed. The source may be blocked or expired.")}
      />
      {err && <PlayerError message={err} />}
    </div>
  );
}

function loadHlsScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    // @ts-expect-error global
    if (typeof window !== "undefined" && window.Hls) return resolve(window.Hls);
    const existing = document.querySelector<HTMLScriptElement>('script[data-hls-loader="1"]');
    if (existing) {
      existing.addEventListener("load", () => {
        // @ts-expect-error global
        window.Hls ? resolve(window.Hls) : reject(new Error("hls.js failed to load"));
      });
      existing.addEventListener("error", () => reject(new Error("hls.js failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js";
    s.async = true;
    s.dataset.hlsLoader = "1";
    s.onload = () => {
      // @ts-expect-error global
      window.Hls ? resolve(window.Hls) : reject(new Error("hls.js failed to load"));
    };
    s.onerror = () => reject(new Error("hls.js failed to load"));
    document.head.appendChild(s);
  });
}

function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<string>("Loading stream…");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    setStatus("loading");
    setMessage("Loading stream…");

    // Native HLS (Safari, iOS)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      const onLoaded = () => setStatus("ready");
      const onErr = () => { setStatus("error"); setMessage("Playback failed. The stream may be blocked or expired."); };
      video.addEventListener("loadedmetadata", onLoaded);
      video.addEventListener("error", onErr);
      return () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onErr);
      };
    }

    loadHlsScript()
      .then((Hls) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          setStatus("error");
          setMessage("HLS is not supported in this browser.");
          return;
        }
        const hls = new Hls({
          maxBufferLength: 30,
          enableWorker: true,
          lowLatencyMode: false,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus("ready");
          video.play().catch(() => { /* autoplay may be blocked */ });
        });
        hls.on(Hls.Events.ERROR, (_evt: any, data: any) => {
          if (!data?.fatal) return;
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // try once to recover
              try { hls.startLoad(); return; } catch {}
              setStatus("error");
              setMessage("Network error while loading the stream.");
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              try { hls.recoverMediaError(); return; } catch {}
              setStatus("error");
              setMessage("Media decoding error.");
              break;
            default:
              setStatus("error");
              setMessage("Link Invalid or Expired");
          }
        });
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setMessage("Failed to load HLS player.");
        }
      });

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
    };
  }, [src]);

  return (
    <div style={{ position: "relative" }}>
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        controlsList="nodownload"
        style={VIDEO_STYLE}
      />
      {status === "loading" && (
        <div style={overlayStyle}>
          <div style={{ opacity: 0.85, fontSize: 14 }}>{message}</div>
        </div>
      )}
      {status === "error" && <PlayerError message={message} />}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  background: "rgba(0,0,0,0.55)",
  color: "#fff",
  pointerEvents: "none",
};

function PlayerError({ message }: { message: string }) {
  return (
    <div style={{ ...overlayStyle, pointerEvents: "auto", flexDirection: "column" }}>
      <div style={{ textAlign: "center", padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#ff6b6b" }}>{message}</div>
        <a href="/" style={{ display: "inline-block", marginTop: 12, color: "#8ab4ff", fontSize: 14 }}>
          ← Try another link
        </a>
      </div>
    </div>
  );
}
