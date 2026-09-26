"use client";

import { cn } from "@/lib/cn";

const THEME_KEY = "java_zero_theme"; // тот же ключ, что у сайта до v1.0

export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // приватный режим без localStorage: тема просто не запомнится
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Сменить тему оформления"
      className={cn(
        "grid size-11 place-items-center sm:size-9 rounded-md text-muted transition-colors duration-150 ease-snappy hover:bg-card hover:text-text",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
