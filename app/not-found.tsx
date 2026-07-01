export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#0b0d10", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#ff6b6b" }}>Link Invalid or Expired</div>
        <div style={{ marginTop: 8, opacity: 0.7, fontSize: 14 }}>The page or stream you requested could not be found.</div>
        <a href="/" style={{ display: "inline-block", marginTop: 20, color: "#8ab4ff" }}>← Go home</a>
      </div>
    </div>
  );
}
