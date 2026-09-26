import type { Metadata } from "next";
import { GroupMap } from "@/components/course/group-map";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";
import { getCourse, getGroupPath } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";

export const metadata: Metadata = {
  title: "Группа",
  description: "Контрольные точки из вуза и подготовка к ним — раздел для одногруппников.",
  // Раздел только для группы: в поиске ему делать нечего
  robots: { index: false, follow: false },
};

export default function GroupPage() {
  const group = getGroupPath();
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="font-display text-3xl font-semibold">{group.title}</h1>
          <p className="mt-1 text-muted">{group.subtitle}</p>
        </div>
        <GroupMap course={toOutline(getCourse())} group={{ invite: group.invite, steps: group.steps }} />
      </main>
      <SiteFooter />
    </>
  );
}
