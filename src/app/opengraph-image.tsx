import { ImageResponse } from "next/og";

export const alt = "DANCE HUB — ダンスとパフォーマンスのイベント情報";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** A dependable social-card fallback for Events without a main image. */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ alignItems: "center", background: "#f3f0e8", color: "#152018", display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", padding: 72, width: "100%" }}>
      <div style={{ color: "#47603d", fontSize: 30, fontWeight: 700, letterSpacing: 8 }}>EVENT GUIDE</div>
      <div style={{ fontSize: 116, fontWeight: 900, letterSpacing: -7, marginTop: 24 }}>DANCE HUB</div>
      <div style={{ borderTop: "3px solid #152018", fontSize: 36, marginTop: 50, paddingTop: 24 }}>ダンスとパフォーマンスのイベント情報</div>
    </div>,
    size,
  );
}
