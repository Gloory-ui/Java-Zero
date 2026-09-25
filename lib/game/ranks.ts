import type { IconName } from "@/lib/icons";

export type Rank = { level: number; title: string; icon: IconName; color: string };

/**
 * Ранги по уровню. Звания за квесты из quest.yaml теперь титулы: их дают достижения «Квест закрыт».
 * Цвета — неон на тёмном фоне; в светлой теме они идут только в свечение и рамки, не в мелкий текст.
 */
export const RANKS: readonly Rank[] = [
  { level: 1, title: "БАЙТ-ПАДАВАН", icon: "sprout", color: "#94a3b8" },
  { level: 3, title: "СТАЖЁР КОМПИЛЯТОРА", icon: "wrench", color: "#38bdf8" },
  { level: 6, title: "КОДЕР-КАДЕТ", icon: "satellite", color: "#22d3ee" },
  { level: 9, title: "ИНЖЕНЕР ЦИКЛОВ", icon: "repeat", color: "#34d399" },
  { level: 12, title: "МАСТЕР АЛГОРИТМОВ", icon: "brain-circuit", color: "#a3e635" },
  { level: 15, title: "СТРАЖ ПАМЯТИ", icon: "shield-check", color: "#facc15" },
  { level: 18, title: "АРХИТЕКТОР ОБЪЕКТОВ", icon: "landmark", color: "#fb923c" },
  { level: 22, title: "МАГИСТР JVM", icon: "coffee", color: "#f43f5e" },
  { level: 26, title: "СЕНЬОР-КИБЕРДЕД", icon: "crown", color: "#e879f9" },
  { level: 30, title: "ЛЕГЕНДА JAVA-ZERO", icon: "gem", color: "#a78bfa" },
];

export function rankForLevel(level: number): Rank {
  return RANKS.findLast((r) => level >= r.level) ?? RANKS[0];
}

export function nextRank(level: number): Rank | undefined {
  return RANKS.find((r) => r.level > level);
}
