import type { Metadata } from "next";
import { CourseMap } from "@/components/course/course-map";
import { DailyQuests } from "@/components/game/daily-quests";
import { LevelCard } from "@/components/game/level-card";
import { JavaPrewarm } from "@/components/lab/java-prewarm";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";
import { toOutline } from "@/lib/content/outline";
import { getCourseWithOverrides } from "@/lib/content/overrides";

export const metadata: Metadata = {
  title: "Карта курса",
  description: "Все квесты курса «Java с нуля» по порядку: от первой программы до циклов, методов и массивов.",
};

// Названия квестов и этапов могут прийти правкой из админки: карта пересобирается не чаще раза в минуту
export const revalidate = 60;

export default async function CoursePage() {
  const course = toOutline(await getCourseWithOverrides());
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
        <CourseMap course={course} />
        <JavaPrewarm />
      </main>
      <SiteFooter />
    </>
  );
}
