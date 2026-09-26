import type { IconName } from "@/lib/icons";

export type Rank = { level: number; title: string; icon: IconName };

/**
 * 100 рангов по уровню, до 999: новый примерно каждые 10 уровней, в начале чаще (3, 5, 10, 13…), чтобы новичок
 * быстро получал первые. Названия идут по пути изучения Java: синтаксис → массивы → ООП → исключения →
 * коллекции → Stream API → потоки → сети и базы → архитектура → JVM → продакшен → легенда.
 * Прежние 25 рангов остались на своих уровнях. Звания за квесты из quest.yaml — титулы, их дают достижения.
 * Цвета у рангов нет: ранг рисуется неоном студента, различают их значок (components/game/rank-badge.tsx) и иконка.
 */
export const RANKS: readonly Rank[] = [
  { level: 1, title: "БАЙТ-ПАДАВАН", icon: "sprout" },
  { level: 3, title: "ИСКАТЕЛЬ КОНСОЛИ", icon: "terminal" },
  { level: 5, title: "СТАЖЁР КОМПИЛЯТОРА", icon: "wrench" },
  { level: 10, title: "КОДЕР-КАДЕТ", icon: "satellite" },
  { level: 13, title: "ЗНАТОК ТИПОВ", icon: "type" },
  { level: 17, title: "ИНЖЕНЕР ЦИКЛОВ", icon: "repeat" },
  { level: 21, title: "ДРЕССИРОВЩИК УСЛОВИЙ", icon: "split" },
  { level: 25, title: "ХРАНИТЕЛЬ ПЕРЕМЕННЫХ", icon: "box" },
  { level: 30, title: "ЛОЦМАН ОПЕРАТОРОВ", icon: "anchor" },
  { level: 35, title: "МАСТЕР ВЕТВЛЕНИЙ", icon: "git-branch" },
  { level: 40, title: "СЛЕДОПЫТ СКОБОК", icon: "braces" },
  { level: 45, title: "ПОКОРИТЕЛЬ МЕТОДОВ", icon: "square-function" },
  { level: 50, title: "МАСТЕР АЛГОРИТМОВ", icon: "brain-circuit" },
  { level: 55, title: "ОХОТНИК ЗА БАГАМИ", icon: "scan-search" },
  { level: 60, title: "АЛХИМИК СТРОК", icon: "quote" },
  { level: 65, title: "СТРАЖ ПАМЯТИ", icon: "shield-check" },
  { level: 70, title: "КАПИТАН МАССИВОВ", icon: "list-ordered" },
  { level: 75, title: "ЗОДЧИЙ ИНДЕКСОВ", icon: "hash" },
  { level: 80, title: "ТКАЧ МАТРИЦ", icon: "grid" },
  { level: 85, title: "СЕЯТЕЛЬ РЕКУРСИИ", icon: "refresh-cw" },
  { level: 90, title: "ПОВЕЛИТЕЛЬ СОРТИРОВОК", icon: "arrow-down-wide-narrow" },
  { level: 95, title: "ШТУРМАН ПОИСКА", icon: "search" },
  { level: 100, title: "АРХИТЕКТОР ОБЪЕКТОВ", icon: "landmark" },
  { level: 105, title: "СКУЛЬПТОР КЛАССОВ", icon: "shapes" },
  { level: 110, title: "МАСТЕР КОНСТРУКТОРОВ", icon: "construction" },
  { level: 115, title: "ХРАНИТЕЛЬ ИНКАПСУЛЯЦИИ", icon: "lock" },
  { level: 120, title: "АКТЁР ПОЛИМОРФИЗМА", icon: "drama" },
  { level: 125, title: "НАСЛЕДНИК КЛАССОВ", icon: "layers" },
  { level: 130, title: "АБСТРАКЦИОНИСТ", icon: "component" },
  { level: 135, title: "ДИПЛОМАТ ИНТЕРФЕЙСОВ", icon: "plug" },
  { level: 140, title: "ЗАКЛИНАТЕЛЬ ENUM", icon: "list" },
  { level: 145, title: "МАСТЕР ПАКЕТОВ", icon: "package" },
  { level: 150, title: "ЛОВЕЦ ИСКЛЮЧЕНИЙ", icon: "bug" },
  { level: 156, title: "УКРОТИТЕЛЬ NULL", icon: "circle-slash" },
  { level: 162, title: "СТРАЖ TRY-CATCH", icon: "shield-alert" },
  { level: 168, title: "ЛЕТОПИСЕЦ ЛОГОВ", icon: "scroll-text" },
  { level: 174, title: "ИНЖЕНЕР ТЕСТОВ", icon: "flask" },
  { level: 180, title: "ЗАКЛИНАТЕЛЬ КОЛЛЕКЦИЙ", icon: "library" },
  { level: 188, title: "ПОВЕЛИТЕЛЬ СПИСКОВ", icon: "list-tree" },
  { level: 196, title: "МАГ ХЕШ-ТАБЛИЦ", icon: "table" },
  { level: 204, title: "ХРАНИТЕЛЬ МНОЖЕСТВ", icon: "boxes" },
  { level: 212, title: "ТКАЧ ОЧЕРЕДЕЙ", icon: "list-end" },
  { level: 220, title: "МАГИСТР JVM", icon: "coffee" },
  { level: 228, title: "ИСКАТЕЛЬ ДЖЕНЕРИКОВ", icon: "code-xml" },
  { level: 236, title: "ВЛАДЫКА ИТЕРАТОРОВ", icon: "iteration-cw" },
  { level: 244, title: "ПОЭТ КОМПАРАТОРОВ", icon: "arrow-up-down" },
  { level: 252, title: "МАСТЕР ФАЙЛОВ", icon: "file-code" },
  { level: 260, title: "ПОВЕЛИТЕЛЬ ПОТОКОВ", icon: "cpu" },
  { level: 268, title: "ДИРИЖЁР STREAM API", icon: "waves" },
  { level: 276, title: "СТРАТЕГ КОНВЕЙЕРОВ", icon: "workflow" },
  { level: 284, title: "ХРАНИТЕЛЬ OPTIONAL", icon: "circle-dashed" },
  { level: 292, title: "ГРОССМЕЙСТЕР РЕГУЛЯРОК", icon: "regex" },
  { level: 300, title: "АРХИМАГ ЛЯМБД", icon: "wand-sparkles" },
  { level: 310, title: "ФУНКЦИОНАЛЬНЫЙ МАГ", icon: "sigma" },
  { level: 320, title: "ЗАКЛИНАТЕЛЬ АННОТАЦИЙ", icon: "at-sign" },
  { level: 330, title: "ИСКАТЕЛЬ РЕФЛЕКСИИ", icon: "scan-eye" },
  { level: 340, title: "МАСТЕР СЕРИАЛИЗАЦИИ", icon: "file-archive" },
  { level: 350, title: "ХАКЕР БАЙТ-КОДА", icon: "binary" },
  { level: 360, title: "СТРАЖ СИНХРОНИЗАЦИИ", icon: "lock-keyhole" },
  { level: 370, title: "УКРОТИТЕЛЬ ГОНОК", icon: "flag" },
  { level: 380, title: "РАЗРУШИТЕЛЬ ДЕДЛОКОВ", icon: "unlink" },
  { level: 390, title: "ИНЖЕНЕР ПУЛОВ", icon: "container" },
  { level: 400, title: "СЕНЬОР-КИБЕРДЕД", icon: "crown" },
  { level: 412, title: "МАСТЕР СЕТЕЙ", icon: "router" },
  { level: 424, title: "ХРАНИТЕЛЬ БАЗ ДАННЫХ", icon: "database" },
  { level: 436, title: "ЖРЕЦ SQL", icon: "database-zap" },
  { level: 448, title: "ПОВЕЛИТЕЛЬ API", icon: "webhook" },
  { level: 460, title: "ГУРУ РЕФАКТОРИНГА", icon: "hammer" },
  { level: 474, title: "ЗОДЧИЙ СБОРОК", icon: "blocks" },
  { level: 488, title: "ИНКВИЗИТОР КОД-РЕВЬЮ", icon: "glasses" },
  { level: 502, title: "ПАТТЕРН-МАСТЕР", icon: "puzzle" },
  { level: 516, title: "СТРАТЕГ SOLID", icon: "pyramid" },
  { level: 530, title: "АРХИТЕКТОР СИСТЕМ", icon: "network" },
  { level: 544, title: "ВЛАСТЕЛИН МИКРОСЕРВИСОВ", icon: "server-cog" },
  { level: 558, title: "ПОКОРИТЕЛЬ ОБЛАКОВ", icon: "cloud" },
  { level: 572, title: "КАПИТАН КОНТЕЙНЕРОВ", icon: "ship" },
  { level: 586, title: "ШТУРМАН KUBERNETES", icon: "ship-wheel" },
  { level: 600, title: "ХРАНИТЕЛЬ JDK", icon: "server" },
  { level: 616, title: "ПРОФАЙЛЕР-ЯСНОВИДЕЦ", icon: "gauge" },
  { level: 633, title: "ГОНЩИК МИЛЛИСЕКУНД", icon: "timer" },
  { level: 650, title: "ЗНАТОК JIT", icon: "flame" },
  { level: 667, title: "ПОВЕЛИТЕЛЬ КУЧИ", icon: "mountain" },
  { level: 684, title: "ИССЛЕДОВАТЕЛЬ МЕТАСПЕЙСА", icon: "telescope" },
  { level: 700, title: "ВЛАСТЕЛИН GC", icon: "recycle" },
  { level: 716, title: "ТЕХНОМАНТ", icon: "atom" },
  { level: 733, title: "СТРАЖ ПРОДАКШЕНА", icon: "shield" },
  { level: 750, title: "УКРОТИТЕЛЬ ИНЦИДЕНТОВ", icon: "siren" },
  { level: 767, title: "ХРАНИТЕЛЬ АПТАЙМА", icon: "activity" },
  { level: 784, title: "НАСТАВНИК ДЖУНОВ", icon: "graduation-cap" },
  { level: 800, title: "КИБЕР-ЛЕГЕНДА", icon: "zap" },
  { level: 816, title: "ПОКРОВИТЕЛЬ ОПЕНСОРСА", icon: "git-fork" },
  { level: 833, title: "ЗВЁЗДНЫЙ КОММИТЕР", icon: "star" },
  { level: 850, title: "ТИТАН КОДОВОЙ БАЗЫ", icon: "castle" },
  { level: 867, title: "ОРАКУЛ JAVA", icon: "eye" },
  { level: 884, title: "ФЕНИКС ДЕПЛОЕВ", icon: "bird" },
  { level: 900, title: "БЕССМЕРТНЫЙ КОМПИЛЯТОР", icon: "infinity" },
  { level: 925, title: "ПОВЕЛИТЕЛЬ ВСЕЛЕННОЙ JAVA", icon: "orbit" },
  { level: 950, title: "ХРАНИТЕЛЬ ИСХОДНИКОВ", icon: "scroll" },
  { level: 975, title: "ПОСЛЕДНИЙ БОСС", icon: "skull" },
  { level: 999, title: "ЛЕГЕНДА JAVA-ZERO", icon: "gem" },
];

export function rankForLevel(level: number): Rank {
  return RANKS.findLast((r) => level >= r.level) ?? RANKS[0];
}

export function nextRank(level: number): Rank | undefined {
  return RANKS.find((r) => r.level > level);
}

export function rankIndex(rank: Pick<Rank, "title">): number {
  return Math.max(
    0,
    RANKS.findIndex((r) => r.title === rank.title),
  );
}

/**
 * Крупный ранг: первые три после старта и каждый десятый. На них — праздничный экран,
 * на остальные — карточка, иначе при 100 рангах экран всплывал бы слишком часто.
 */
export function isMajorRank(rank: Pick<Rank, "title">): boolean {
  const i = rankIndex(rank);
  return i <= 3 || i % 10 === 0;
}
