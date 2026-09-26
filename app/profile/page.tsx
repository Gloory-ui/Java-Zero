import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/profile-view";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";
import { getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";

export const metadata: Metadata = {
  title: "Профиль",
  description: "Ранг, серия, ачивки и настройки AI-ментора в Java-Zero.",
};

export default function ProfilePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-10">
        <ProfileView course={toOutline(getCourse())} />
      </main>
      <SiteFooter />
    </>
  );
}
