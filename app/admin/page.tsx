import { redirect } from "next/navigation";

// Первый раздел админки — обзор со статистикой
export default function AdminPage() {
  redirect("/admin/overview");
}
