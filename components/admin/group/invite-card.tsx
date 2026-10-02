"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { AdminError, adminRpc } from "@/lib/admin/client";

const CODE_RE = /^[a-z0-9]{6,32}$/;

const describe = (error: unknown) =>
  error instanceof AdminError && /invalid invite code/i.test(error.message)
    ? "Код — латиница в нижнем регистре и цифры, от 6 до 32 символов."
    : error instanceof Error
      ? error.message
      : "Запрос не выполнен.";

/** Ссылка-приглашение в группу: показать, скопировать, сменить код. Старая ссылка после смены не пускает новых */
export function InviteCard() {
  const [code, setCode] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    adminRpc<string>("admin_group_invite")
      .then(setCode)
      .catch((e: unknown) => setError(describe(e)));
  }, []);

  const link = code ? `${origin}/group?join=${code}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Браузер не дал скопировать: выдели ссылку и скопируй вручную.");
    }
  };

  const rotate = async (next?: string) => {
    setBusy(true);
    setError(null);
    try {
      setCode(await adminRpc<string>("admin_group_set_invite", next ? { p_code: next } : {}));
      setConfirming(false);
      setCustom("");
    } catch (e) {
      setError(describe(e));
    } finally {
      setBusy(false);
    }
  };

  const saveCustom = (event: FormEvent) => {
    event.preventDefault();
    const next = custom.trim().toLowerCase();
    if (!CODE_RE.test(next)) {
      setError("Код — латиница в нижнем регистре и цифры, от 6 до 32 символов.");
      return;
    }
    void rotate(next);
  };

  return (
    <section
      aria-labelledby="group-invite"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
    >
      <div>
        <h2 id="group-invite" className="font-display text-xl font-semibold">
          Ссылка-приглашение
        </h2>
        <p className="text-sm text-muted">
          По ней одногруппник после входа в аккаунт попадает в группу. Код хранится только в базе.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {code === null ? (
        !error && <div className="h-11 animate-pulse rounded-md bg-card motion-reduce:animate-none" aria-busy="true" />
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            readOnly
            value={link}
            aria-label="Ссылка-приглашение"
            onFocus={(e) => e.currentTarget.select()}
            className="h-11 min-w-0 flex-1 rounded-md border border-border bg-card px-3 font-mono text-sm sm:h-10"
          />
          <Button variant="secondary" onClick={copy}>
            <Icon name={copied ? "check" : "clipboard-check"} className="size-4" />
            {copied ? "Скопировано" : "Скопировать"}
          </Button>
        </div>
      )}

      {code !== null && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {confirming ? (
            <div className="flex flex-col gap-2 rounded-md border border-gold/40 bg-gold/10 p-3 text-sm">
              <p>Старая ссылка перестанет пускать новых людей. Кто уже в группе, останется в ней. Сменить код?</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => rotate()} disabled={busy}>
                  Сменить на случайный
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Button variant="secondary" onClick={() => setConfirming(true)}>
                <Icon name="refresh-cw" className="size-4" />
                Новый случайный код
              </Button>
            </div>
          )}
          <form onSubmit={saveCustom} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
              Свой код
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="например, epai2026"
                autoComplete="off"
                spellCheck={false}
                className="h-11 rounded-md border border-border bg-card px-3 font-mono text-sm sm:h-10"
              />
            </label>
            <Button type="submit" variant="secondary" disabled={busy || custom.trim() === ""}>
              Сохранить код
            </Button>
          </form>
        </div>
      )}
    </section>
  );
}
