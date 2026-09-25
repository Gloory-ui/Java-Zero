"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { useAccount } from "@/lib/account/store";
import { cn } from "@/lib/cn";
import { useProfile, useProfileHydrated } from "@/lib/profile/store";

/** Аватар из GitHub/Google; если картинка не загрузилась (блокировщик, удалённое фото), показываем первую букву имени. */
export function Avatar({ name, src, size = "sm" }: { name: string | null; src: string | null; size?: "sm" | "lg" }) {
  const box = size === "lg" ? "size-16 text-2xl" : "size-8 text-sm";
  const [broken, setBroken] = useState<string | null>(null);
  if (src && broken !== src) {
    return (
      // biome-ignore lint/performance/noImgElement: аватар с GitHub/Google, next/image потребовал бы список доменов
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(src)}
        className={cn("rounded-full object-cover", box)}
      />
    );
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
  const profileReady = useProfileHydrated();
  // Своя картинка из профиля главнее аватара GitHub/Google, но только если профиль этого же аккаунта
  const custom = useProfile((s) => (profileReady && user && s.owner === user.id ? s.avatarUrl : null));
  const name = useProfile((s) => (profileReady && user && s.owner === user.id ? s.displayName : null));

  if (status === "signed-in" && user) {
    return (
      <Link
        href="/profile"
        className="rounded-full"
        aria-label={`Профиль: ${name ?? user.name ?? user.email ?? "аккаунт"}`}
      >
        <Avatar name={name ?? user.name} src={custom ?? user.avatar} />
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
