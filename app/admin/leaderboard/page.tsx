import type { Metadata } from "next";
import { AdminLeaderboard } from "@/components/admin/leaderboard/admin-leaderboard";

export const metadata: Metadata = { title: "Лидерборд" };

export default function AdminLeaderboardPage() {
  return <AdminLeaderboard />;
}
