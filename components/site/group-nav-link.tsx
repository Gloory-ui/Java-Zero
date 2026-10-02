"use client";

import Link from "next/link";
import { useGroupMember } from "@/lib/progress/visible";

/** Пункт «Группа» в шапке: виден только участникам группы (по ответу сервера) */
export function GroupNavLink({ className }: { className: string }) {
  const member = useGroupMember();
  if (!member) return null;
  return (
    <Link href="/group" className={className}>
      Группа
    </Link>
  );
}
