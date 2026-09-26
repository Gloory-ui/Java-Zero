import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/site/brand-mark";
import { rankForLevel } from "@/lib/game/ranks";
import { levelInfo } from "@/lib/game/xp";
import { accentById, HANDLE_RE } from "@/lib/profile/cosmetics";
import { safeMediaUrl } from "@/lib/profile/safe-url";
import { supabaseConfig } from "@/lib/supabase/config";
import type { PublicProfile } from "@/lib/supabase/database";

export const alt = "Профиль студента Java-Zero";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (pkg: string, file: string) =>
  readFile(join(process.cwd(), "node_modules/@fontsource", pkg, "files", file));

// satori берёт только первый файл с одним именем семейства: латиница и кириллица — разные семейства
const DISPLAY = "Unbounded, Unbounded Cyrillic";
const BODY = "Onest, Onest Cyrillic";

/** Публичный профиль по нику. Закрытый, несуществующий или недоступный — null: превью без личных данных */
async function loadProfile(handle: string): Promise<PublicProfile | null> {
  if (!supabaseConfig || !HANDLE_RE.test(handle)) return null;
  try {
    const res = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_public_profile`, {
      method: "POST",
      headers: {
        apikey: supabaseConfig.key,
        Authorization: `Bearer ${supabaseConfig.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_handle: handle }),
      signal: AbortSignal.timeout(4000),
    });
    return res.ok ? ((await res.json()) as PublicProfile | null) : null;
  } catch {
    return null;
  }
}

/**
 * Аватар для картинки. satori рисует только PNG и JPEG, а свои аватары у нас в WebP:
 * тогда вместо фото — буква имени. Картинка встраивается data-URL, чтобы сбой чужого сервера не ронял превью.
 */
async function loadAvatar(url: string | null): Promise<string | null> {
  const safe = safeMediaUrl(url);
  if (!safe) return null;
  try {
    const res = await fetch(safe, { signal: AbortSignal.timeout(3000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/^image\/(png|jpeg)/.test(type)) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > 1_500_000) return null;
    return `data:${type.split(";")[0]};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 40 }}>{value}</div>
      <div style={{ fontSize: 20, color: "#97a3b6", textTransform: "uppercase", letterSpacing: 3 }}>{label}</div>
    </div>
  );
}

export default async function ProfileImage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [profile, displayLatin, displayCyrillic, bodyLatin, bodyCyrillic] = await Promise.all([
    loadProfile(handle),
    font("unbounded", "unbounded-latin-700-normal.woff"),
    font("unbounded", "unbounded-cyrillic-700-normal.woff"),
    font("onest", "onest-latin-400-normal.woff"),
    font("onest", "onest-cyrillic-400-normal.woff"),
  ]);
  const avatar = profile ? await loadAvatar(profile.avatar_url) : null;

  const color = accentById(profile?.accent).color;
  const xp = profile?.xp_total ?? 0;
  const level = levelInfo(xp).level;
  const rank = rankForLevel(level);
  const name = profile ? profile.display_name || `@${profile.handle}` : "Профиль скрыт";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        color: "#f4f6f8",
        fontFamily: BODY,
        background: `radial-gradient(90% 120% at 100% 0%, ${color}55, transparent 60%), #08090c`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <BrandMark size={52} />
        <div style={{ fontFamily: DISPLAY, fontSize: 28 }}>Java-Zero</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
        <div
          style={{
            display: "flex",
            width: 220,
            height: 220,
            borderRadius: 110,
            padding: 6,
            background: color,
            boxShadow: `0 0 60px ${color}`,
          }}
        >
          {avatar ? (
            // biome-ignore lint/performance/noImgElement: satori рисует только <img>
            <img src={avatar} alt="" width={208} height={208} style={{ borderRadius: 104, objectFit: "cover" }} />
          ) : (
            <div
              style={{
                display: "flex",
                width: 208,
                height: 208,
                borderRadius: 104,
                alignItems: "center",
                justifyContent: "center",
                background: "#131822",
                fontFamily: DISPLAY,
                fontSize: 96,
              }}
            >
              {profile ? name.replace(/^@/, "").slice(0, 1).toUpperCase() : "?"}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 760 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 64, lineHeight: 1.05 }}>{name}</div>
          {profile && <div style={{ fontSize: 30, color: "#97a3b6" }}>{`@${profile.handle}`}</div>}
          {profile && (
            <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
              <div
                style={{
                  display: "flex",
                  padding: "8px 18px",
                  borderRadius: 12,
                  border: `2px solid ${color}`,
                  fontSize: 22,
                  letterSpacing: 2,
                }}
              >
                {rank.title}
              </div>
              {profile.title && (
                <div
                  style={{
                    display: "flex",
                    padding: "8px 18px",
                    borderRadius: 12,
                    border: "2px solid rgba(255,255,255,0.2)",
                    fontSize: 22,
                    letterSpacing: 2,
                  }}
                >
                  {profile.title}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {profile ? (
        <div style={{ display: "flex", gap: 72 }}>
          <Stat value={`Ур. ${level}`} label="Уровень" />
          <Stat value={xp.toLocaleString("ru-RU")} label="Опыт" />
          <Stat value={String(profile.stages_passed)} label="Этапов сдано" />
          <Stat value={String(profile.achievements.length)} label="Достижений" />
        </div>
      ) : (
        <div style={{ fontSize: 30, color: "#97a3b6" }}>Java с нуля, шаг за шагом</div>
      )}
    </div>,
    {
      ...size,
      fonts: [
        { name: "Unbounded", data: displayLatin, weight: 700, style: "normal" },
        { name: "Unbounded Cyrillic", data: displayCyrillic, weight: 700, style: "normal" },
        { name: "Onest", data: bodyLatin, weight: 400, style: "normal" },
        { name: "Onest Cyrillic", data: bodyCyrillic, weight: 400, style: "normal" },
      ],
    },
  );
}
