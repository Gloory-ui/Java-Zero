import type { Metadata } from "next";
import Link from "next/link";
import { CourseMap } from "@/components/course/course-map";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";

export const metadata: Metadata = {
  title: "Карта курса",
  description: "Все квесты Java-Zero по порядку: от переменных до контрольной точки и калькулятора.",
};

export default function CoursePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-display text-base font-semibold">
          Java-Zero
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-col gap-6">
        <h1 className="font-display text-3xl font-semibold">Карта курса</h1>
        <CourseMap course={toOutline(getCourse())} />
      </main>
    </div>
  );
}
