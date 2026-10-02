"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { AdminError, adminRpc } from "@/lib/admin/client";
import type { GroupMemberRow } from "@/lib/group/types";

const SOURCE: Record<GroupMemberRow["source"], string> = {
  invite: "по ссылке",
  admin: "выдал админ",
  legacy: "был в группе до обновления",
};

const day = new Intl.DateTimeFormat("ru", { day: "numeric", month: "short", year: "numeric" });

type Props = {
  members: GroupMemberRow[] | null;
  /** Список изменился: перечитать участников и прогресс */
  onChange: () => void;
};

/** Участники группы: выдать доступ по нику, забрать доступ. Прогресс студента при отзыве остаётся */
export function MembersSection({ members, onChange }: Props) {
  const [handle, setHandle] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const grant = async (event: FormEvent) => {
    event.preventDefault();
    const nick = handle.trim().replace(/^@/, "");
    if (!nick) return;
    setBusy(true);
    setMessage(null);
    try {
      await adminRpc<string>("admin_group_grant", { p_handle: nick });
      setMessage({ ok: true, text: `@${nick.toLowerCase()} теперь в группе.` });
      setHandle("");
      onChange();
    } catch (e) {
      const text =
        e instanceof AdminError && /user not found/i.test(e.message)
          ? `Студента с ником @${nick} нет. Ник виден в его профиле.`
          : e instanceof Error
            ? e.message
            : "Запрос не выполнен.";
      setMessage({ ok: false, text });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (member: GroupMemberRow) => {
    setBusy(true);
    setMessage(null);
    try {
      await adminRpc("admin_group_revoke", { p_user: member.user_id });
      setMessage({ ok: true, text: `Доступ у ${member.handle ? `@${member.handle}` : "студента"} забран.` });
      setRevoking(null);
      onChange();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Запрос не выполнен." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="group-members"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
    >
      <div>
        <h2 id="group-members" className="font-display text-xl font-semibold">
          Участники{members ? ` · ${members.length}` : ""}
        </h2>
        <p className="text-sm text-muted">
          Доступ к заданиям КТ. Если забрать доступ, прогресс студента сохранится и вернётся вместе с доступом.
        </p>
      </div>

      <form onSubmit={grant} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          Ник студента
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@nickname"
            autoComplete="off"
            spellCheck={false}
            className="h-11 rounded-md border border-border bg-card px-3 text-sm sm:h-10"
          />
        </label>
        <Button type="submit" disabled={busy || handle.trim() === ""}>
          Выдать доступ
        </Button>
      </form>

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={
            message.ok
              ? "rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm"
              : "rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm"
          }
        >
          {message.text}
        </p>
      )}

      {members === null ? (
        <div className="h-32 animate-pulse rounded-md bg-card motion-reduce:animate-none" aria-busy="true" />
      ) : members.length === 0 ? (
        <p className="text-sm text-muted">В группе пока никого. Отправьте ссылку-приглашение в чат группы.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {members.map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {m.handle ? (
                    <Link href={`/u/${m.handle}`} className="hover:underline">
                      {m.display_name || `@${m.handle}`}
                    </Link>
                  ) : (
                    (m.display_name ?? "Без ника")
                  )}
                  {m.handle && <span className="ml-2 font-normal text-muted">@{m.handle}</span>}
                </p>
                <p className="text-sm text-muted">
                  {SOURCE[m.source]}
                  {m.source === "admin" && m.added_by_handle ? ` @${m.added_by_handle}` : ""} ·{" "}
                  {day.format(new Date(m.joined_at))}
                </p>
              </div>
              {revoking === m.user_id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm">Забрать доступ?</span>
                  <Button variant="secondary" onClick={() => revoke(m)} disabled={busy}>
                    Да, забрать
                  </Button>
                  <Button variant="ghost" onClick={() => setRevoking(null)} disabled={busy}>
                    Отмена
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setRevoking(m.user_id)}
                  aria-label={`Забрать доступ у ${m.handle ? `@${m.handle}` : (m.display_name ?? "студента")}`}
                >
                  <Icon name="x" className="size-4" />
                  Забрать доступ
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
