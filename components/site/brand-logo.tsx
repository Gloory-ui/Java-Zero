"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { phonkDrop } from "@/lib/game/events";

const CLICK_GAP_MS = 700;

/** Логотип. Пасхалка со старого сайта: три быстрых клика включают 808-бас. */
export function BrandLogo() {
  const clicks = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [flash, setFlash] = useState(false);

  const onClick = () => {
    clicks.current += 1;
    clearTimeout(timer.current);
    if (clicks.current >= 3) {
      clicks.current = 0;
      phonkDrop();
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      return;
    }
    timer.current = setTimeout(() => {
      clicks.current = 0;
    }, CLICK_GAP_MS);
  };

  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Java-Zero, на главную"
      className="flex items-center gap-2 font-display text-base font-semibold"
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-7 place-items-center rounded-md bg-accent-solid font-mono text-xs text-white transition-[scale,box-shadow] duration-300 ease-snappy",
          flash && "scale-110 shadow-glow",
        )}
      >
        J0
      </span>
      <span className="hidden sm:inline">Java-Zero</span>
    </Link>
  );
}
