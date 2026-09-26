"use client";

import Link from "next/link";
import type { QuestOutline } from "@/lib/content/outline";
import { useGroupMember } from "@/lib/progress/visible";

/** Пункт «Группа» в шапке: виден только участникам группы. groupQuests — квесты КТ, по ним узнаём старых участников */
export function GroupNavLink({ groupQuests, className }: { groupQuests: QuestOutline[]; className: string }) {
  const member = useGroupMember(groupQuests);
  if (!member) return null;
  return (
    <Link href="/group" className={className}>
      Группа
    </Link>
  );
}
