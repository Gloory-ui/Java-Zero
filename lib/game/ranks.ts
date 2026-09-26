import type { IconName } from "@/lib/icons";

export type Rank = { level: number; title: string; icon: IconName };

/**
 * 25 рангов по уровню, до 999. В начале ранги идут чаще (5, 10, 17…), чтобы новичок быстро получал первые,
 * дальше реже. Звания за квесты из quest.yaml — титулы: их дают достижения «Квест закрыт».
 * Цвета у рангов нет: уровень и ранг везде рисуются фирменным неоном (--accent), ранги различают иконки.
 */
export const RANKS: readonly Rank[] = [
  { level: 1, title: "БАЙТ-ПАДАВАН", icon: "sprout" },
  { level: 5, title: "СТАЖЁР КОМПИЛЯТОРА", icon: "wrench" },
  { level: 10, title: "КОДЕР-КАДЕТ", icon: "satellite" },
  { level: 17, title: "ИНЖЕНЕР ЦИКЛОВ", icon: "repeat" },
  { level: 25, title: "ХРАНИТЕЛЬ ПЕРЕМЕННЫХ", icon: "box" },
  { level: 35, title: "МАСТЕР ВЕТВЛЕНИЙ", icon: "git-branch" },
  { level: 50, title: "МАСТЕР АЛГОРИТМОВ", icon: "brain-circuit" },
  { level: 65, title: "СТРАЖ ПАМЯТИ", icon: "shield-check" },
  { level: 80, title: "ТКАЧ МАТРИЦ", icon: "grid" },
  { level: 100, title: "АРХИТЕКТОР ОБЪЕКТОВ", icon: "landmark" },
  { level: 125, title: "НАСЛЕДНИК КЛАССОВ", icon: "layers" },
  { level: 150, title: "ЛОВЕЦ ИСКЛЮЧЕНИЙ", icon: "bug" },
  { level: 180, title: "ЗАКЛИНАТЕЛЬ КОЛЛЕКЦИЙ", icon: "library" },
  { level: 220, title: "МАГИСТР JVM", icon: "coffee" },
  { level: 260, title: "ПОВЕЛИТЕЛЬ ПОТОКОВ", icon: "cpu" },
  { level: 300, title: "АРХИМАГ ЛЯМБД", icon: "wand-sparkles" },
  { level: 350, title: "ХАКЕР БАЙТ-КОДА", icon: "binary" },
  { level: 400, title: "СЕНЬОР-КИБЕРДЕД", icon: "crown" },
  { level: 460, title: "ГУРУ РЕФАКТОРИНГА", icon: "hammer" },
  { level: 530, title: "АРХИТЕКТОР СИСТЕМ", icon: "network" },
  { level: 600, title: "ХРАНИТЕЛЬ JDK", icon: "server" },
  { level: 700, title: "ВЛАСТЕЛИН GC", icon: "recycle" },
  { level: 800, title: "КИБЕР-ЛЕГЕНДА", icon: "zap" },
  { level: 900, title: "БЕССМЕРТНЫЙ КОМПИЛЯТОР", icon: "infinity" },
  { level: 999, title: "ЛЕГЕНДА JAVA-ZERO", icon: "gem" },
];

export function rankForLevel(level: number): Rank {
  return RANKS.findLast((r) => level >= r.level) ?? RANKS[0];
}

export function nextRank(level: number): Rank | undefined {
  return RANKS.find((r) => r.level > level);
}
