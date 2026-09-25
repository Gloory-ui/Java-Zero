import type { Metadata } from "next";
import { AchievementsCatalog } from "@/components/game/achievements-catalog";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";
import { getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";

export const metadata: Metadata = {
  title: "Достижения",
  description: "Все достижения Java-Zero: за этапы, защиты, серии дней, квесты дня и тайные знаки.",
};

export default function AchievementsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70dvh] max-w-4xl flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="font-display text-3xl font-semibold">Достижения</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Каждое достижение даёт опыт: обычное 25 XP, редкое 75, эпическое 150, легендарное 300. Серии растут от I до
            V, а условия тайных знаков скрыты, пока не найдёшь их.
          </p>
        </div>
        <AchievementsCatalog course={toOutline(getCourse())} />
      </main>
      <SiteFooter />
    </>
  );
}
