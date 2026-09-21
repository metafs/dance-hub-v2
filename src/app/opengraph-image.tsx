import { ImageResponse } from "next/og";

export const alt = "p8ce（ペイス）— 東京都・神奈川県のダンスとパフォーマンスを探す";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * A dependable social-card fallback for Events without a main image. It uses
 * only the two official colours (docs/brand/identity.md) and sets the name
 * with its one-line description, as the name never stands alone.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ background: "#ffffff", color: "#141414", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", padding: 88, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
        <div style={{ fontSize: 132, fontWeight: 600, letterSpacing: -6 }}>p8ce</div>
        <div style={{ color: "#5f5f5b", fontSize: 36 }}>ペイス</div>
      </div>
      <div style={{ borderTop: "2px solid #141414", display: "flex", fontSize: 40, paddingTop: 32 }}>
        東京都・神奈川県のダンスとパフォーマンスを探す
      </div>
    </div>,
    size,
  );
}
