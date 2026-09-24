"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { useAccount } from "@/lib/account/store";
import { cn } from "@/lib/cn";

export function Avatar({ name, src, size = "sm" }: { name: string | null; src: string | null; size?: "sm" | "lg" }) {
  const box = size === "lg" ? "size-16 text-2xl" : "size-8 text-sm";
  if (src) {
    // biome-ignore lint/performance/noImgElement: аватар с GitHub/Google, next/image потребовал бы список доменов
    return <img src={src} alt="" referrerPolicy="no-referrer" className={cn("rounded-full object-cover", box)} />;
  }
  return (
    <span className={cn("grid place-items-center rounded-full bg-accent-solid font-semibold text-white", box)}>
      {(name ?? "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Кнопка аккаунта в шапке: «Войти» или аватар со ссылкой на профиль. Без Supabase — только ссылка на профиль. */
export function AccountMenu() {
  const status = useAccount((s) => s.status);
  const user = useAccount((s) => s.user);
  const pathname = usePathname();

  if (status === "signed-in" && user) {
    return (
      <Link href="/profile" className="rounded-full" aria-label={`Профиль: ${user.name ?? user.email ?? "аккаунт"}`}>
        <Avatar name={user.name} src={user.avatar} />
      </Link>
    );
  }
  if (status === "signed-out") {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className={buttonClasses({ variant: "secondary" }, "h-9")}
      >
        Войти
      </Link>
    );
  }
  if (status === "loading") return <span className="size-8 animate-pulse rounded-full bg-card" aria-hidden="true" />;
  return (
    <Link href="/profile" className={buttonClasses({ variant: "ghost" }, "h-9")}>
      Профиль
    </Link>
  );
}
