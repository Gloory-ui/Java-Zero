"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminRpc } from "@/lib/admin/client";
import { type QuestOutline, withGroupTitles } from "@/lib/content/outline";
import { useGroupTitles } from "@/lib/group/access";
import type { GroupMemberRow, GroupProgressRow } from "@/lib/group/types";
import { InviteCard } from "./invite-card";
import { MembersSection } from "./members-section";
import { ProgressTable } from "./progress-table";

type Props = {
  /** Квесты КТ из публичного оглавления; настоящие названия заданий админ получает с сервера */
  quests: QuestOutline[];
};

/** Вкладка «Группа»: ссылка-приглашение, участники и прогресс по КТ. Права проверяют функции базы */
export function GroupAdmin({ quests: publicQuests }: Props) {
  const [members, setMembers] = useState<GroupMemberRow[] | null>(null);
  const [progress, setProgress] = useState<GroupProgressRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const titles = useGroupTitles(true);
  const quests = useMemo(() => withGroupTitles(publicQuests, titles), [publicQuests, titles]);
  const questIds = useMemo(() => publicQuests.map((q) => q.id), [publicQuests]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, p] = await Promise.all([
        adminRpc<GroupMemberRow[]>("admin_group_members"),
        adminRpc<GroupProgressRow[]>("admin_group_progress", { p_quests: questIds }),
      ]);
      setMembers(m ?? []);
      setProgress(p ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить группу.");
    }
  }, [questIds]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm"
        >
          <span>{error} Если функций группы нет в базе, выполните миграцию 20261001130000_group_access.sql.</span>
          <Button variant="secondary" onClick={() => void load()}>
            Повторить
          </Button>
        </div>
      )}
      <InviteCard />
      <MembersSection members={members} onChange={() => void load()} />
      <ProgressTable quests={quests} members={members} progress={progress} />
    </div>
  );
}
