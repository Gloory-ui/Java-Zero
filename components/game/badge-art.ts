import type { Achievement, AchievementGroup, Rarity } from "@/lib/game/achievements";

/** Рисунок значка выводится из id: у каждого достижения свой узор, оттенок и темп анимаций, при каждой отрисовке одинаковые */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: детерминированный генератор от id */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function polygon(n: number, r: number, rotDeg = 0): string {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = ((-90 + rotDeg + (i * 360) / n) * Math.PI) / 180;
    return `${r1(50 + r * Math.cos(a))} ${r1(50 + r * Math.sin(a))}`;
  });
  return `M${pts.join(" ")}Z`;
}

/** Круг с насечками по краю: медальон квестов дня */
function notched(n: number, outer: number, inner: number): string {
  const pts = Array.from({ length: n * 2 }, (_, i) => {
    const a = ((-90 + (i * 180) / n) * Math.PI) / 180;
    const r = i % 2 ? inner : outer;
    return `${r1(50 + r * Math.cos(a))} ${r1(50 + r * Math.sin(a))}`;
  });
  return `M${pts.join(" ")}Z`;
}

/** Форма рамки по группе: по силуэту видно, откуда достижение */
export const SHAPE: Record<AchievementGroup, string> = {
  course: polygon(6, 46),
  mastery: polygon(8, 46, 22.5),
  exam: "M50 5 88 17v30c0 24-16 40-38 48C28 87 12 71 12 47V17Z",
  streak: "M28 7h44a21 21 0 0 1 21 21v44a21 21 0 0 1-21 21H28A21 21 0 0 1 7 72V28A21 21 0 0 1 28 7Z",
  daily: notched(16, 46, 42.5),
  secret: "M50 3 97 50 50 97 3 50Z",
};

export type Palette = {
  /** Основной тон: полоса прогресса, обводка карточки */
  color: string;
  icon: string;
  stroke: [string, string];
  hue: number;
  sat: number;
  /** Перелив по рамке: только эпические и легендарные */
  conic?: string;
};

export const PALETTE: Record<Rarity, Palette> = {
  common: { color: "#94a3b8", icon: "#e2e8f0", stroke: ["#e2e8f0", "#64748b"], hue: 215, sat: 18 },
  rare: { color: "#38bdf8", icon: "#bae6fd", stroke: ["#bae6fd", "#0284c7"], hue: 199, sat: 60 },
  epic: {
    color: "#a855f7",
    icon: "#f3e8ff",
    stroke: ["#f0abfc", "#7c3aed"],
    hue: 275,
    sat: 55,
    conic: "#a855f7, #ec4899, #60a5fa, #c084fc, #a855f7",
  },
  legendary: {
    color: "#f5a524",
    icon: "#fef3c7",
    stroke: ["#fde68a", "#d97706"],
    hue: 36,
    sat: 70,
    conic: "#fde68a, #f5a524, #ff4d6d, #c084fc, #38bdf8, #34d399, #fde68a",
  },
};

export type OrnamentKind = "rays" | "rings" | "orbit" | "stars" | "waves" | "grid";
const KINDS: readonly OrnamentKind[] = ["rays", "rings", "orbit", "stars", "waves", "grid"];

export type Sparkle = { x: number; y: number; s: number; delay: number };

export type BadgeArt = {
  shape: string;
  palette: Palette;
  /** Оттенок лицевой стороны: свой у каждого id внутри тона редкости */
  faceHue: number;
  ornament: { kind: OrnamentKind; count: number; rotate: number; paths: string[]; dots: [number, number, number][] };
  spinSec: number;
  sheenSec: number;
  delaySec: number;
  glitchSec: number;
  iridescent: boolean;
  glitch: boolean;
  sparkles: Sparkle[];
  decor: Decor;
};

/** Декор вокруг рамки и внутри неё. spin крутится, still стоит на месте */
export type Decor = {
  spin: string[];
  still: string[];
  shards: { d: string; fill: boolean }[];
  /** Листья лавра: неподвижные, залитые */
  leaves: string[];
  /** Грани от центра к вершинам рамки и звезда-сигил на лицевой стороне */
  inner: string[];
};

function ornament(kind: OrnamentKind, rand: () => number): BadgeArt["ornament"] {
  const rotate = Math.round(rand() * 360);
  const paths: string[] = [];
  const dots: [number, number, number][] = [];
  let count = 0;
  switch (kind) {
    case "rays": {
      count = 8 + Math.floor(rand() * 5) * 2;
      for (let i = 0; i < count; i++) {
        const a = (i * 2 * Math.PI) / count;
        const len = i % 2 ? 34 : 48;
        paths.push(
          `M${r1(50 + 14 * Math.cos(a))} ${r1(50 + 14 * Math.sin(a))}L${r1(50 + len * Math.cos(a))} ${r1(50 + len * Math.sin(a))}`,
        );
      }
      break;
    }
    case "rings": {
      count = 2 + Math.floor(rand() * 3);
      for (let i = 0; i < count; i++) {
        const r = 18 + i * (26 / count) + rand() * 4;
        paths.push(`M${r1(50 - r)} 50a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0`);
      }
      break;
    }
    case "orbit": {
      count = 2 + Math.floor(rand() * 3);
      const r = 30 + rand() * 8;
      paths.push(`M${r1(50 - r)} 50a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0`);
      for (let i = 0; i < count; i++) {
        const a = rand() * 2 * Math.PI;
        dots.push([r1(50 + r * Math.cos(a)), r1(50 + r * Math.sin(a)), r1(2 + rand() * 2)]);
      }
      break;
    }
    case "stars": {
      count = 5 + Math.floor(rand() * 4);
      const pts: [number, number][] = [];
      for (let i = 0; i < count; i++) {
        const a = rand() * 2 * Math.PI;
        const r = 16 + rand() * 26;
        pts.push([r1(50 + r * Math.cos(a)), r1(50 + r * Math.sin(a))]);
      }
      pts.sort((p, q) => p[0] - q[0]);
      paths.push(`M${pts.map((p) => p.join(" ")).join("L")}`);
      for (const [x, y] of pts) dots.push([x, y, r1(1.2 + rand() * 1.6)]);
      break;
    }
    case "waves": {
      count = 3 + Math.floor(rand() * 3);
      const amp = 3 + rand() * 4;
      for (let i = 0; i < count; i++) {
        const y = 22 + (i * 56) / (count - 1);
        paths.push(`M-10 ${r1(y)}q10 ${r1(-amp)} 20 0t20 0 20 0 20 0 20 0 20 0`);
      }
      break;
    }
    case "grid": {
      count = 5 + Math.floor(rand() * 3);
      const step = 80 / (count - 1);
      for (let i = 0; i < count; i++)
        for (let j = 0; j < count; j++) dots.push([r1(10 + i * step), r1(10 + j * step), (i + j) % 2 ? 1 : 1.6]);
      break;
    }
  }
  return { kind, count, rotate, paths, dots };
}

const f = (n: number) => r1(n).toString();
const polar = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [r1(50 + r * Math.cos(a)), r1(50 + r * Math.sin(a))];
};

/** Наклонная орбита-завиток вокруг значка: эллипс с поворотом оси */
function swirl(rx: number, ry: number, rot: number): string {
  const [x1, y1] = polar(rx, rot);
  const [x2, y2] = polar(rx, rot + 180);
  return `M${x1} ${y1}A${f(rx)} ${f(ry)} ${f(rot)} 1 0 ${x2} ${y2}A${f(rx)} ${f(ry)} ${f(rot)} 1 0 ${x1} ${y1}`;
}

function arc(r: number, from: number, span: number): string {
  const [x1, y1] = polar(r, from);
  const [x2, y2] = polar(r, from + span);
  return `M${x1} ${y1}A${f(r)} ${f(r)} 0 ${span > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

function shard(kind: number, x: number, y: number, size: number, rot: number): string {
  const pts = (n: number, r: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = ((rot + (i * 360) / n) * Math.PI) / 180;
      return `${f(x + r * Math.cos(a))} ${f(y + r * Math.sin(a))}`;
    }).join(" ");
  if (kind === 0) return `M${pts(3, size)}Z`;
  if (kind === 1) return `M${pts(4, size)}Z`;
  if (kind === 2)
    return `M${f(x - size)} ${f(y)}a${f(size)} ${f(size)} 0 1 0 ${f(2 * size)} 0a${f(size)} ${f(size)} 0 1 0 ${f(-2 * size)} 0`;
  return `M${pts(6, size)}Z`;
}

/** Лавровая ветвь: дуга снизу вверх по боку и листья вдоль неё */
function laurel(side: 1 | -1): string[] {
  const out: string[] = [];
  const cx = 50;
  const path = (t: number): [number, number] => {
    const deg = 100 + t * 130;
    const [x, y] = polar(58, side === 1 ? 180 - deg : deg);
    return [x, y];
  };
  const [sx, sy] = path(0);
  const [ex, ey] = path(1);
  const [mx, my] = path(0.5);
  out.push(`M${sx} ${sy}Q${f(2 * mx - (sx + ex) / 2)} ${f(2 * my - (sy + ey) / 2)} ${ex} ${ey}`);
  for (let i = 1; i <= 5; i++) {
    const [x, y] = path(i / 6);
    const dx = (x - cx) * 0.14;
    const dy = (y - 50) * 0.14;
    out.push(
      `M${x} ${y}q${f(dx - dy * 0.6)} ${f(dy + dx * 0.6)} ${f(dx * 1.6)} ${f(dy * 1.6)}q${f(-dx * 0.2 + dy * 0.6)} ${f(-dy * 0.2 - dx * 0.6)} ${f(-dx * 1.6)} ${f(-dy * 1.6)}`,
    );
  }
  return out;
}

const VERTICES: Partial<Record<AchievementGroup, [number, number]>> = {
  course: [6, 0],
  mastery: [8, 22.5],
  secret: [4, 0],
  streak: [4, 45],
};

function decor(a: Pick<Achievement, "group" | "rarity" | "series">, rand: () => number): Decor {
  const level = { common: 1, rare: 2, epic: 3, legendary: 4 }[a.rarity];
  const spin: string[] = [];
  const still: string[] = [];
  const shards: Decor["shards"] = [];
  const inner: string[] = [];
  const leaves: string[] = [];

  const pool = ["ticks", "arcs", "corners", "swirl", "dots"];
  // Перемешиваем набор от id и берём столько, сколько позволяет редкость
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j] as string, pool[i] as string];
  }
  const picked = new Set(pool.slice(0, level));
  if (level >= 3) picked.add("swirl");

  if (picked.has("ticks")) {
    const n = [24, 36, 48][Math.floor(rand() * 3)] as number;
    for (let i = 0; i < n; i++) {
      const long = i % 4 === 0;
      const [x1, y1] = polar(long ? 52 : 54, (i * 360) / n);
      const [x2, y2] = polar(long ? 59 : 57, (i * 360) / n);
      still.push(`M${x1} ${y1}L${x2} ${y2}`);
    }
  }
  if (picked.has("arcs")) {
    const n = 2 + Math.floor(rand() * 3);
    const start = rand() * 360;
    for (let i = 0; i < n; i++) spin.push(arc(60 + (i % 2) * 4, start + (i * 360) / n, 25 + rand() * 45));
  }
  if (picked.has("corners")) {
    const o = -6;
    const l = 10 + rand() * 6;
    still.push(
      `M${o} ${f(o + l)}V${o}H${f(o + l)}`,
      `M${f(100 - o - l)} ${o}H${100 - o}V${f(o + l)}`,
      `M${100 - o} ${f(100 - o - l)}V${100 - o}H${f(100 - o - l)}`,
      `M${f(o + l)} ${100 - o}H${o}V${f(100 - o - l)}`,
    );
  }
  if (picked.has("swirl")) {
    const n = 2 + Math.floor(rand() * 2) + (level === 4 ? 1 : 0);
    const base = rand() * 180;
    for (let i = 0; i < n; i++) spin.push(swirl(56 + rand() * 8, 14 + rand() * 12, base + (i * 180) / n));
  }
  if (picked.has("dots")) {
    const n = 12 + Math.floor(rand() * 12);
    for (let i = 0; i < n; i++) {
      const [x, y] = polar(62, (i * 360) / n);
      shards.push({ d: shard(2, x, y, i % 3 ? 0.8 : 1.4, 0), fill: true });
    }
  }
  if (level >= 3) {
    const n = level === 4 ? 7 : 4;
    for (let i = 0; i < n; i++) {
      const [x, y] = polar(64 + rand() * 6, rand() * 360);
      shards.push({ d: shard(Math.floor(rand() * 4), x, y, 2 + rand() * 2.5, rand() * 360), fill: rand() > 0.5 });
    }
  }
  if (level === 4) {
    // Корона над рамкой
    still.push("M38 -3 41 -12 46 -5 50 -15 54 -5 59 -12 62 -3Z");
  }
  if (level === 4 || (a.series && a.series.tier >= 4)) {
    for (const side of [1, -1] as const) {
      const [stem, ...rest] = laurel(side);
      if (stem) still.push(stem);
      leaves.push(...rest);
    }
  }

  const vertices = VERTICES[a.group];
  if (vertices && level >= 2) {
    const [n, rot] = vertices;
    for (let i = 0; i < n; i++) {
      const [x, y] = polar(a.group === "secret" ? 47 : 45, -90 + rot + (i * 360) / n);
      inner.push(`M50 50L${x} ${y}`);
    }
  }
  if (level >= 2) {
    const n = 5 + Math.floor(rand() * 4);
    const k = n === 6 ? 2 : Math.floor((n - 1) / 2);
    const rot = rand() * 360;
    const pts = Array.from({ length: n }, (_, i) => polar(30, rot + ((i * k) % n) * (360 / n)).join(" "));
    inner.push(`M${pts.join("L")}Z`);
  }
  return { spin, still, shards, leaves, inner };
}

const cache = new Map<string, BadgeArt>();

export function badgeArt(a: Pick<Achievement, "id" | "group" | "rarity" | "secret" | "series">): BadgeArt {
  const key = `${a.id}:${a.rarity}:${a.group}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const seed = hash(a.id);
  const rand = rng(seed);
  const palette = PALETTE[a.rarity];
  const spread = a.rarity === "common" ? 12 : 24;
  const kind = KINDS[seed % KINDS.length] as OrnamentKind;
  const high = a.rarity === "epic" || a.rarity === "legendary";
  const sparkleCount = a.rarity === "legendary" ? 4 : a.rarity === "epic" ? 2 : 0;
  const art: BadgeArt = {
    shape: SHAPE[a.group],
    palette,
    faceHue: Math.round(palette.hue + (rand() - 0.5) * spread),
    ornament: ornament(kind, rand),
    spinSec: Math.round(18 + rand() * 22),
    sheenSec: r1(4 + rand() * 3),
    delaySec: r1(-rand() * 6),
    glitchSec: r1(3.5 + rand() * 4),
    iridescent: high,
    // Глитч: все легендарные и тайные и примерно треть эпических
    glitch:
      a.rarity === "legendary" || Boolean(a.secret) || a.group === "secret" || (a.rarity === "epic" && seed % 3 === 0),
    sparkles: Array.from({ length: sparkleCount }, (_, i) => {
      const ang = ((i / sparkleCount) * 360 + rand() * 60 - 30) * (Math.PI / 180);
      const r = 47 + rand() * 6;
      return {
        x: r1(50 + r * Math.cos(ang)),
        y: r1(50 + r * Math.sin(ang)),
        s: r1(6 + rand() * 5),
        delay: r1(-rand() * 3),
      };
    }),
    decor: decor(a, rng(seed ^ 0x9e3779b9)),
  };
  cache.set(key, art);
  return art;
}

/** CSS-маска из SVG-пути: заливка лица или только обводка рамки */
export function svgMask(d: string, stroke?: number): string {
  const body = stroke
    ? `<path d='${d}' fill='none' stroke='#000' stroke-width='${stroke}' stroke-linejoin='round'/>`
    : `<path d='${d}' fill='#000'/>`;
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>${body}</svg>`)}")`;
}
