import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Склеивает классы и убирает конфликтующие утилиты Tailwind (последняя побеждает). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
