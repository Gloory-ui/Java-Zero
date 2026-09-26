import Link from "next/link";
import { Fragment } from "react";
import { AccountMenu } from "@/components/account/account-menu";
import { LevelChip } from "@/components/game/level-chip";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";
import { getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { BrandLogo } from "./brand-logo";
import { GroupNavLink } from "./group-nav-link";

// Шапка должна влезать в 375 px: «Справочник» виден с 400 px (он есть и в подвале), «Достижения» и «Профиль» — с 768 px
// (в профиль ведут чип уровня и кнопка аккаунта), «Лидеры» — с 1024 px (ссылка есть в подвале и в профиле).
// «Группа» — только участникам группы, с 1024 px: на узких экранах в раздел ведёт плашка на карте курса
const NAV = [
  { href: "/course", label: "Курс", from: "flex" },
  { href: "/handbook", label: "Справочник", from: "hidden min-[400px]:flex" },
  { href: "/achievements", label: "Достижения", from: "hidden md:flex" },
  { href: "/leaderboard", label: "Лидеры", from: "hidden lg:flex" },
  { href: "/profile", label: "Профиль", from: "hidden md:flex" },
];

// На телефоне ссылка во всю высоту зоны нажатия (44 px), на широком экране — компактная
const LINK =
  "h-11 items-center rounded-md px-2.5 text-sm text-muted transition-colors duration-150 ease-snappy hover:bg-card hover:text-text sm:h-auto sm:px-3 sm:py-1.5";

export function SiteHeader() {
  const groupQuests = toOutline(getCourse()).filter((q) => q.track === "group");
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
        <BrandLogo />
        <nav aria-label="Разделы сайта" className="ml-auto flex items-center">
          {NAV.map((item) => (
            <Fragment key={item.href}>
              <Link href={item.href} className={cn(LINK, item.from)}>
                {item.label}
              </Link>
              {item.href === "/course" && (
                <GroupNavLink groupQuests={groupQuests} className={cn(LINK, "hidden lg:flex")} />
              )}
            </Fragment>
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
        <p>Java-Zero: Java с нуля, шаг за шагом.</p>
        <nav aria-label="Ссылки в подвале" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/handbook" className="inline-flex min-h-11 items-center hover:text-text sm:min-h-0">
            Справочник
          </Link>
          <Link href="/leaderboard" className="inline-flex min-h-11 items-center hover:text-text sm:min-h-0">
            Лидеры
          </Link>
          <Link href="/profile" className="inline-flex min-h-11 items-center hover:text-text sm:min-h-0">
            Профиль
          </Link>
          <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-text sm:min-h-0">
            Конфиденциальность
          </Link>
          <a
            href="https://github.com/Gloory-ui/Java-Zero"
            className="inline-flex min-h-11 items-center hover:text-text sm:min-h-0"
            target="_blank"
            rel="noreferrer"
          >
            Исходный код на GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
