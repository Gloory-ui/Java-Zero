"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { AdminError, adminRpc } from "@/lib/admin/client";
import { cn } from "@/lib/cn";

/** Строка public.admin_leaderboard */
type Row = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  created_at: string;
  xp: number;
  raw_xp: number;
  stages_passed: number;
  unknown_rows: number;
  burst: number;
  last_active: string | null;
  banned: boolean;
  ban_reason: string;
};

/** Столько этапов за один час честно не сдать: каждый — теория, код и проверка */
const BURST_LIMIT = 15;

type Flag = { label: string; title: string };

/** Признаки накрутки: подсказка админу, решение — за ним */
function flags(row: Row): Flag[] {
  const out: Flag[] = [];
  if (row.raw_xp > row.xp) {
    out.push({
      label: `+${row.raw_xp - row.xp} XP не засчитано`,
      title: "В базе больше опыта, чем дают настоящие этапы",
    });
  }
  if (row.unknown_rows > 0) {
    out.push({ label: `${row.unknown_rows} чужих строк`, title: "Этапы или достижения, которых нет в курсе" });
  }
  if (row.burst >= BURST_LIMIT) {
    out.push({ label: `${row.burst} этапов за час`, title: "Слишком быстро для честной сдачи" });
  }
  return out;
}

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });
const formatDate = (iso: string | null) => (iso ? dateFormat.format(new Date(iso)) : "—");
const numberFormat = new Intl.NumberFormat("ru-RU");

type State = { kind: "loading" } | { kind: "ready"; rows: Row[] } | { kind: "error"; message: string };

function BanControl({ row, onDone }: { row: Row; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  const save = async (banned: boolean) => {
    setBusy(true);
    setError(null);
    try {
      await adminRpc("admin_set_leaderboard_ban", { p_user: row.user_id, p_banned: banned, p_reason: reason.trim() });
      setOpen(false);
      setReason("");
      onDone();
    } catch (e) {
      setError(e instanceof AdminError ? e.message : "Не получилось сохранить.");
    } finally {
      setBusy(false);
    }
  };

  if (row.banned) {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button variant="secondary" disabled={busy} onClick={() => save(false)}>
          <Icon name="rotate-ccw" />
          Вернуть в рейтинг
        </Button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }
  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        <Icon name="circle-slash" />
        Снять с рейтинга
      </Button>
    );
  }
  return (
    <form
      className="flex w-full flex-col gap-2 sm:w-72"
      onSubmit={(e) => {
        e.preventDefault();
        void save(true);
      }}
    >
      <label htmlFor={inputId} className="text-sm text-muted">
        Причина (видна только админам)
      </label>
      <input
        id={inputId}
        value={reason}
        maxLength={200}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Например: накрутка опыта"
        className="h-11 rounded-md border border-border bg-surface px-3 text-sm sm:h-10"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          Снять
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
          Отмена
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}

/**
 * Лидерборд глазами админа: все студенты, включая снятых, опыт с каталогом и «как есть» и признаки накрутки.
 * Снятие с рейтинга не трогает прогресс: студент учится дальше, только не в таблице лидеров
 */
export function AdminLeaderboard() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [onlySuspicious, setOnlySuspicious] = useState(false);
  const [state, setState] = useState<State>({ kind: "loading" });
  const searchId = useId();

  // Поиск уходит в базу через 300 мс после последней буквы
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    let alive = true;
    adminRpc<Row[]>("admin_leaderboard", { p_search: query || null, p_limit: 200 })
      .then((rows) => {
        if (alive) setState({ kind: "ready", rows });
      })
      .catch((e: unknown) => {
        if (alive)
          setState({ kind: "error", message: e instanceof AdminError ? e.message : "Не получилось загрузить." });
      });
    return () => {
      alive = false;
    };
  }, [query]);

  useEffect(() => load(), [load]);

  const rows =
    state.kind === "ready" ? state.rows.filter((r) => !onlySuspicious || r.banned || flags(r).length > 0) : [];

  return (
    <section className="flex flex-col gap-4" aria-labelledby="admin-leaderboard-title">
      <div className="flex flex-col gap-1">
        <h2 id="admin-leaderboard-title" className="font-display text-xl font-semibold">
          Лидерборд
        </h2>
        <p className="text-sm text-muted">
          Опыт считает база: только настоящие этапы, достижения и квесты дня, не дороже честного максимума. Снятый
          студент учится дальше, но в таблицу лидеров не попадает.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor={searchId} className="sr-only">
          Поиск по нику или имени
        </label>
        <input
          id={searchId}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ник или имя"
          className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm sm:h-10 sm:max-w-xs"
        />
        <label className="flex min-h-11 items-center gap-2 text-sm sm:min-h-10">
          <input type="checkbox" checked={onlySuspicious} onChange={(e) => setOnlySuspicious(e.target.checked)} />
          Только подозрительные и снятые
        </label>
      </div>

      {state.kind === "loading" && (
        <div className="h-48 animate-pulse rounded-2xl bg-card motion-reduce:animate-none" />
      )}
      {state.kind === "error" && (
        <p role="alert" className="rounded-xl border border-border bg-card p-4 text-danger">
          {state.message}
        </p>
      )}
      {state.kind === "ready" && rows.length === 0 && (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-muted">Никого не нашлось.</p>
      )}

      {rows.length > 0 && (
        <ol className="flex flex-col gap-2">
          {rows.map((row, i) => {
            const rowFlags = flags(row);
            return (
              <li
                key={row.user_id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
                  row.banned ? "border-danger/50" : rowFlags.length ? "border-gold/50" : "border-border",
                )}
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-mono text-sm text-muted">{i + 1}.</span>
                    {row.handle ? (
                      <Link href={`/u/${row.handle}`} className="font-semibold hover:underline">
                        @{row.handle}
                      </Link>
                    ) : (
                      <span className="font-semibold text-muted">без ника</span>
                    )}
                    {row.display_name && <span className="truncate text-sm text-muted">{row.display_name}</span>}
                  </div>
                  <p className="text-sm text-muted">
                    <span className="font-semibold text-text">{numberFormat.format(row.xp)} XP</span> · этапов{" "}
                    {row.stages_passed} · с {formatDate(row.created_at)} · активность {formatDate(row.last_active)}
                  </p>
                  {(rowFlags.length > 0 || row.banned) && (
                    <ul className="flex flex-wrap gap-1.5">
                      {row.banned && (
                        <li className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-semibold text-danger">
                          Снят{row.ban_reason ? `: ${row.ban_reason}` : ""}
                        </li>
                      )}
                      {rowFlags.map((f) => (
                        <li
                          key={f.label}
                          title={f.title}
                          className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold"
                        >
                          {f.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <BanControl row={row} onDone={load} />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
