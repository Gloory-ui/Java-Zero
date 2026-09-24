import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Onest, Unbounded } from "next/font/google";
import { Toaster } from "@/components/game/toaster";
import "./globals.css";

const display = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--font-unbounded", display: "swap" });
const sans = Onest({ subsets: ["latin", "cyrillic"], variable: "--font-onest", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://java-zero.onrender.com"),
  title: { default: "Java-Zero — Java с нуля", template: "%s · Java-Zero" },
  description:
    "Учи Java с нуля: теория, задания, которые проверяет настоящий компилятор в браузере, защита у профессора и AI-ментор.",
  // Превью ветки next не должно попасть в поиск; на релизе включается SITE_INDEX=true
  robots: { index: process.env.SITE_INDEX === "true", follow: process.env.SITE_INDEX === "true" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090c" },
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
  ],
};

// Тема ставится до первой отрисовки, иначе светлая тема мигает тёмной. Ключ тот же, что у сайта до v1.0
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem("java_zero_theme")==="light"?"light":"dark"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      data-theme="dark"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: статичная строка без пользовательских данных */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
