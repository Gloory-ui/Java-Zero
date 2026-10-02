import type { Metadata } from "next";
import type { CourseIndex } from "@/components/admin/overview/model";
import { Overview } from "@/components/admin/overview/overview";
import { getCourse } from "@/lib/content/load";

export const metadata: Metadata = { title: "Обзор" };

/**
 * Обзор админки. Числа приходят из функций базы уже в браузере админа; страница отдаёт только порядок
 * и названия этапов общего курса. Этапы группы закрыты, их названий в коде страницы нет
 */
export default function AdminOverviewPage() {
  const course: CourseIndex = getCourse()
    .filter((quest) => quest.track === "course")
    .map((quest) => ({
      id: quest.id,
      num: quest.num,
      title: quest.title,
      stages: quest.stages.map((stage) => ({ id: stage.id, title: stage.title })),
    }));
  return <Overview course={course} />;
}
