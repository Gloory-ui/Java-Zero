import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

type StyleProps = { variant?: Variant; size?: Size };

// Нажатие быстрее отпускания (75 против 150 мс) и сжатие до 0.97; hover в Tailwind 4 срабатывает только на устройствах с мышью
const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap select-none " +
  "transition-[transform,background-color,border-color,box-shadow,color] duration-150 ease-snappy " +
  "active:scale-[0.97] active:duration-75 motion-reduce:active:scale-100 " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-accent-solid text-white hover:bg-accent-solid-hover hover:shadow-glow",
  secondary: "border border-border bg-card text-text hover:border-border-strong hover:bg-card-hover",
  ghost: "text-muted hover:bg-card hover:text-text",
};

const sizes: Record<Size, string> = {
  // На телефоне 44 px — минимум для пальца (UI/UX Pro Max), на широком экране 40 px
  md: "h-11 px-4 text-sm sm:h-10",
  lg: "h-12 px-6 text-base",
};

export function buttonClasses({ variant = "primary", size = "md" }: StyleProps = {}, className?: string): string {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({ variant, size, className, type = "button", ...props }: ComponentProps<"button"> & StyleProps) {
  return <button type={type} className={buttonClasses({ variant, size }, className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonClasses({ variant, size }, className)} {...props} />;
}
