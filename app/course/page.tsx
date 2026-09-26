import type { Metadata } from "next";
import { CourseMap } from "@/components/course/course-map";
import { DailyQuests } from "@/components/game/daily-quests";
import { LevelCard } from "@/components/game/level-card";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";
import { getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";

export const metadata: Metadata = {
  title: "Карта курса",
  description: "Все квесты курса «Java с нуля» по порядку: от первой программы до циклов, методов и массивов.",
};

export default function CoursePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="font-display text-3xl font-semibold">Java с нуля</h1>
          <p className="mt-1 text-muted">Карта курса: квесты открываются по порядку, от первой программы и дальше.</p>
        </div>
        <LevelCard />
        <DailyQuests />
        <CourseMap course={toOutline(getCourse())} />
      </main>
      <SiteFooter />
    </>
  );
}
