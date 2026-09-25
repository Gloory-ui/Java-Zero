import Link from "next/link";
import { AccountMenu } from "@/components/account/account-menu";
import { LevelChip } from "@/components/game/level-chip";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";
import { BrandLogo } from "./brand-logo";

// Шапка должна влезать в 375 px: «Справочник» виден с 400 px (он есть и в подвале), «Достижения» и «Профиль» — с 768 px
// (в профиль ведут чип уровня и кнопка аккаунта), «Лидеры» — с 1024 px (ссылка есть в подвале и в профиле)
const NAV = [
  { href: "/course", label: "Курс", from: "" },
  { href: "/handbook", label: "Справочник", from: "hidden min-[400px]:block" },
  { href: "/achievements", label: "Достижения", from: "hidden md:block" },
  { href: "/leaderboard", label: "Лидеры", from: "hidden lg:block" },
  { href: "/profile", label: "Профиль", from: "hidden md:block" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
        <BrandLogo />
        <nav aria-label="Разделы сайта" className="ml-auto flex items-center">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors duration-150 ease-snappy hover:bg-card hover:text-text sm:px-3",
                item.from,
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <LevelChip className="ml-1" />
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
        <p>Java-Zero: Java с нуля до сданной контрольной.</p>
        <nav aria-label="Ссылки в подвале" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/handbook" className="hover:text-text">
            Справочник
          </Link>
          <Link href="/leaderboard" className="hover:text-text">
            Лидеры
          </Link>
          <Link href="/profile" className="hover:text-text">
            Профиль
          </Link>
          <Link href="/privacy" className="hover:text-text">
            Конфиденциальность
          </Link>
          <a href="https://github.com/Gloory-ui/Java-Zero" className="hover:text-text" target="_blank" rel="noreferrer">
            Исходный код на GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
