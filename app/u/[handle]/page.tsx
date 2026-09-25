import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProfilePage } from "@/components/profile/public-profile";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";
import { getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { HANDLE_RE } from "@/lib/profile/cosmetics";

export async function generateMetadata({ params }: PageProps<"/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: `@${handle}`,
    description: `Профиль студента @${handle} на Java-Zero: уровень, серия и достижения.`,
  };
}

/** Публичный профиль. Страница собирается по запросу, а данные грузятся в браузере из Supabase */
export default async function UserPage({ params }: PageProps<"/u/[handle]">) {
  const { handle } = await params;
  if (!HANDLE_RE.test(handle)) notFound();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[70dvh] max-w-4xl px-4 py-8">
        <PublicProfilePage handle={handle} course={toOutline(getCourse())} />
      </main>
      <SiteFooter />
    </>
  );
}
