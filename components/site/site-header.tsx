import Link from "next/link";
import { AccountMenu } from "@/components/account/account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";
import { BrandLogo } from "./brand-logo";

// На телефоне «Профиль» прячется: туда ведёт кнопка аккаунта справа, а три ссылки не помещаются в 375 px
const NAV = [
  { href: "/course", label: "Курс", mobile: true },
  { href: "/handbook", label: "Справочник", mobile: true },
  { href: "/profile", label: "Профиль", mobile: false },
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
                !item.mobile && "hidden sm:block",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
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
        <nav aria-label="Ссылки в подвале" className="flex gap-4">
          <Link href="/profile" className="hover:text-text">
            Профиль
          </Link>
          <a href="https://github.com/Gloory-ui/Java-Zero" className="hover:text-text" target="_blank" rel="noreferrer">
            Исходный код на GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
