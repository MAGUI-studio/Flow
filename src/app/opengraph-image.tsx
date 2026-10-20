import { ImageResponse } from "next/og";
export const alt = "Flow — Seu tempo, em boa companhia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#f5f4ff",
        padding: 72,
        color: "#18181b",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 74,
          fontWeight: 700,
          letterSpacing: -4,
        }}
      >
        Flow<span style={{ color: "#635BFF", marginLeft: 12 }}>✳</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 60,
            fontWeight: 700,
            maxWidth: 1000,
          }}
        >
          Seu tempo, em boa companhia.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#635BFF",
            marginTop: 24,
          }}
        >
          Encontre seu próximo cuidado. Agende com o Flow.
        </div>
      </div>
    </div>,
    size,
  );
}
