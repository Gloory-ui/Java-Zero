import type { Metadata } from "next";
import { AdminQuests } from "@/components/admin/quests/admin-quests";

export const metadata: Metadata = { title: "Квесты" };

export default function AdminQuestsPage() {
  return <AdminQuests />;
}
