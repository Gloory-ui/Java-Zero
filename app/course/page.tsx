import type { Metadata } from "next";
import { CourseMap } from "@/components/course/course-map";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";
import { getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";

export const metadata: Metadata = {
  title: "Карта курса",
  description: "Все квесты Java-Zero по порядку: от переменных до контрольной точки и калькулятора.",
};

export default function CoursePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col gap-6 px-4 py-10">
        <h1 className="font-display text-3xl font-semibold">Карта курса</h1>
        <CourseMap course={toOutline(getCourse())} />
      </main>
      <SiteFooter />
    </>
  );
}
