import type { Metadata } from "next";
import Link from "next/link";
import { ProfileView } from "@/components/profile/profile-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";

export const metadata: Metadata = {
  title: "Профиль",
  description: "Ранг, серия, ачивки и настройки AI-ментора в Java-Zero.",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <Link href="/course" className="text-sm text-muted hover:text-text">
          ← Карта курса
        </Link>
        <ThemeToggle />
      </header>
      <main>
        <ProfileView course={toOutline(getCourse())} />
      </main>
    </div>
  );
}
