"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Hub Stream</h1>
      <p style={{ opacity: 0.7, marginTop: 0 }}>Paste a hubcloud.cx or hubdrive.tips link to stream it.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) router.push(`/watch?url=${encodeURIComponent(url.trim())}`);
        }}
        style={{ display: "flex", gap: 8, marginTop: 24 }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://hubcloud.cx/drive/... or https://hubdrive.tips/file/..."
          style={{ flex: 1, padding: "12px 14px", borderRadius: 8, border: "1px solid #333", background: "#15151c", color: "#eaeaea" }}
        />
        <button
          type="submit"
          style={{ padding: "12px 20px", borderRadius: 8, border: 0, background: "#4f46e5", color: "#fff", fontWeight: 600, cursor: "pointer" }}
        >
          Stream
        </button>
      </form>
      <div style={{ marginTop: 32, opacity: 0.6, fontSize: 14 }}>
        <div>Example:</div>
        <ul>
          <li>https://hubcloud.cx/drive/obooerjmumaw1om</li>
          <li>https://hubdrive.tips/file/2494615379</li>
        </ul>
      </div>
    </main>
  );
}
