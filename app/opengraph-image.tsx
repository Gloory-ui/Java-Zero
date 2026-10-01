import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/site/brand-mark";

export const alt = "Java-Zero: Java с нуля, шаг за шагом";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Картинка собирается при сборке. Шрифты с кириллицей из @fontsource (OFL): satori читает woff, но не woff2
const font = (pkg: string, file: string) =>
  readFile(join(process.cwd(), "node_modules/@fontsource", pkg, "files", file));

// satori берёт только первый файл с одним именем семейства: латиница и кириллица — разные семейства, по порядку
const DISPLAY = "Unbounded, Unbounded Cyrillic";
const BODY = "Onest, Onest Cyrillic";

function Check({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, color }}>
      <div style={{ width: 14, height: 14, borderRadius: 7, background: color }} />
      {label}
    </div>
  );
}

export default async function OpengraphImage() {
  const [displayLatin, displayCyrillic, bodyLatin, bodyCyrillic] = await Promise.all([
    font("unbounded", "unbounded-latin-700-normal.woff"),
    font("unbounded", "unbounded-cyrillic-700-normal.woff"),
    font("onest", "onest-latin-400-normal.woff"),
    font("onest", "onest-cyrillic-400-normal.woff"),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#08090c",
        color: "#f4f6f8",
        fontFamily: BODY,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <BrandMark size={64} />
        <div style={{ fontFamily: DISPLAY, fontSize: 34 }}>Java-Zero</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 68, lineHeight: 1.1, maxWidth: 1000 }}>
          Java с нуля, шаг за шагом
        </div>
        <div style={{ fontSize: 30, color: "#97a3b6", maxWidth: 1000 }}>
          Квесты от первой программы, настоящий компилятор в браузере и защита у профессора
        </div>
      </div>
      <div style={{ display: "flex", gap: 36, fontSize: 26 }}>
        <Check label="Код компилируется" color="#10b981" />
        <Check label="Тесты: 4 из 4" color="#10b981" />
        <Check label="Этап сдан" color="#f5a524" />
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Unbounded", data: displayLatin, weight: 700, style: "normal" },
        { name: "Unbounded Cyrillic", data: displayCyrillic, weight: 700, style: "normal" },
        { name: "Onest", data: bodyLatin, weight: 400, style: "normal" },
        { name: "Onest Cyrillic", data: bodyCyrillic, weight: 400, style: "normal" },
      ],
    },
  );
}
