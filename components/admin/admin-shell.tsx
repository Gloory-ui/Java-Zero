"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useAdminStatus } from "@/lib/admin/client";
import { cn } from "@/lib/cn";
import type { IconName } from "@/lib/icons";

/** Разделы админки. Каждый живёт в своей папке app/admin/<раздел> и components/admin/<раздел> */
export const ADMIN_TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin/overview", label: "Обзор", icon: "gauge" },
  { href: "/admin/quests", label: "Квесты", icon: "book-open" },
  { href: "/admin/leaderboard", label: "Лидерборд", icon: "trophy" },
  { href: "/admin/group", label: "Группа", icon: "graduation-cap" },
];

function Notice({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-12 text-center">
      <Icon name={icon} className="size-8 text-muted" />
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}

/**
 * Оболочка админки: проверка прав и вкладки разделов. Права здесь — только подсказка интерфейсу:
 * данные отдают функции базы и маршруты, которые проверяют админа сами
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const status = useAdminStatus();
  const pathname = usePathname();

  if (status === "loading" || status === "checking" || status === "unknown") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-11 w-full animate-pulse rounded-xl bg-card motion-reduce:animate-none" />
        <div className="h-64 w-full animate-pulse rounded-2xl bg-card motion-reduce:animate-none" />
      </div>
    );
  }
  if (status === "disabled") return <Notice icon="lock" title="Аккаунты на сайте не настроены" />;
  if (status === "signed-out") {
    return (
      <Notice icon="lock" title="Админка — только после входа">
        <ButtonLink href="/login?next=/admin">Войти</ButtonLink>
      </Notice>
    );
  }
  if (status === "error") {
    return (
      <Notice icon="shield-alert" title="Не получилось проверить права">
        <p className="text-muted">Проверьте связь и обновите страницу.</p>
      </Notice>
    );
  }
  if (status === "not-admin") {
    return (
      <Notice icon="lock" title="Нет доступа">
        <p className="text-muted">Этот раздел — для администраторов сайта.</p>
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Разделы админки" className="-mx-4 overflow-x-auto px-4">
        <ul className="inline-flex gap-1 rounded-xl border border-border bg-surface p-1">
          {ADMIN_TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold whitespace-nowrap sm:h-10",
                    "transition-colors duration-150 ease-snappy",
                    active ? "bg-card text-text shadow-sm" : "text-muted hover:text-text",
                  )}
                >
                  <Icon name={tab.icon} className="size-4" />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {children}
    </div>
  );
}
