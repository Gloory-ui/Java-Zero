import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { BadgePreview } from "./badge-preview";

export const metadata: Metadata = { title: "Витрина значков", robots: { index: false } };

/** Витрина всех значков и звуков для проверки дизайна. Только в разработке: на живом сайте 404 */
export default function BadgesDevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <BadgePreview course={toOutline(getCourse())} />;
}
