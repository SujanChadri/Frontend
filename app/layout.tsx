export const metadata = {
  title: "Hub Stream",
  description: "Stream hubcloud / hubdrive links",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b0b0f", color: "#eaeaea", fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
