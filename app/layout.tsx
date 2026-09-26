import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Onest, Unbounded } from "next/font/google";
import { AccountProvider } from "@/components/account/account-provider";
import { GameBootstrap } from "@/components/game/game-bootstrap";
import { Toaster } from "@/components/game/toaster";
import { getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { ACCENTS, DEFAULT_LOOK } from "@/lib/profile/cosmetics";
import { SITE_INDEXED, SITE_URL } from "@/lib/site";
import "./globals.css";

const display = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--font-unbounded", display: "swap" });
const sans = Onest({ subsets: ["latin", "cyrillic"], variable: "--font-onest", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Java-Zero — Java с нуля", template: "%s · Java-Zero" },
  description:
    "Учи Java с нуля: теория, задания, которые проверяет настоящий компилятор в браузере, защита у профессора и AI-ментор.",
  // Превью ветки next не должно попасть в поиск; на релизе включается SITE_INDEX=true
  robots: { index: SITE_INDEXED, follow: SITE_INDEXED },
  openGraph: { type: "website", locale: "ru_RU", siteName: "Java-Zero" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090c" },
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
  ],
};

// Тема ставится до первой отрисовки, иначе светлая тема мигает тёмной. Ключ тот же, что у сайта до v1.0.
// Там же — цвет неона из профиля: иначе уровень и ранг на мгновение мелькают фирменным красным
const accentColors = JSON.stringify(
  Object.fromEntries(ACCENTS.filter((a) => a.id !== DEFAULT_LOOK.accent).map((a) => [a.id, a.color])),
);
const themeScript = `try{var d=document.documentElement;d.dataset.theme=localStorage.getItem("java_zero_theme")==="light"?"light":"dark";var p=JSON.parse(localStorage.getItem("java-zero-profile")||"{}"),c=${accentColors}[p.state&&p.state.accent];if(c)d.style.setProperty("--neon-user",c)}catch(e){}`;

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
        {/* Первая остановка Tab: перепрыгнуть шапку сразу к содержанию страницы. Видна только с клавиатуры */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-accent-solid focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-glow"
        >
          Перейти к содержанию
        </a>
        {children}
        <Toaster />
        <GameBootstrap course={toOutline(getCourse())} />
        <AccountProvider />
      </body>
    </html>
  );
}
