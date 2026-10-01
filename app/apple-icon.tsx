import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/site/brand-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS сам скругляет углы, поэтому знак рисуется во весь квадрат на фирменном фоне
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#e11d48" }}>
      <BrandMark size={180} />
    </div>,
    size,
  );
}
