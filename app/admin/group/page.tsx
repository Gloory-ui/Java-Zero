import type { Metadata } from "next";
import { GroupAdmin } from "@/components/admin/group/group-admin";
import { getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";

export const metadata: Metadata = { title: "Группа" };

// В HTML только публичное оглавление КТ (без названий заданий): остальное админ получает после проверки прав
export default function AdminGroupPage() {
  return <GroupAdmin quests={toOutline(getCourse()).filter((q) => q.track === "group")} />;
}
