import type { Metadata } from "next";
import { Leaderboard } from "@/components/profile/leaderboard";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Таблица лидеров",
  description: "Студенты Java-Zero с публичным профилем: кто больше всех набрал опыта за неделю и за всё время.",
};

export default function LeaderboardPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="font-display text-3xl font-semibold">Таблица лидеров</h1>
          <p className="mt-2 text-muted">
            Опыт за этапы, достижения и квесты дня. В таблице — только студенты, которые открыли свой профиль.
          </p>
        </div>
        <Leaderboard />
      </main>
      <SiteFooter />
    </>
  );
}
