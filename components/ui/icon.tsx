import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  Box,
  BrainCircuit,
  BrickWall,
  Briefcase,
  CalendarDays,
  Cat,
  Check,
  CircleCheck,
  Coffee,
  Compass,
  Crosshair,
  Crown,
  Divide,
  Flame,
  FlaskConical,
  Gem,
  Gift,
  Glasses,
  Globe,
  GraduationCap,
  Grid3x3,
  Headphones,
  Keyboard,
  Landmark,
  Layers,
  Lightbulb,
  Lock,
  type LucideIcon,
  Map as MapIcon,
  Medal,
  Moon,
  Package,
  Play,
  Puzzle,
  Repeat,
  Rocket,
  RotateCcw,
  Satellite,
  ShieldCheck,
  Smile,
  Snowflake,
  Sparkles,
  Sprout,
  Star,
  Sunrise,
  Swords,
  Target,
  Timer,
  Trophy,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { IconName } from "@/lib/icons";

const ICONS: Record<IconName, LucideIcon> = {
  "arrow-right": ArrowRight,
  award: Award,
  "book-open": BookOpen,
  bot: Bot,
  box: Box,
  "brain-circuit": BrainCircuit,
  "brick-wall": BrickWall,
  briefcase: Briefcase,
  "calendar-days": CalendarDays,
  cat: Cat,
  check: Check,
  "circle-check": CircleCheck,
  coffee: Coffee,
  compass: Compass,
  crosshair: Crosshair,
  crown: Crown,
  divide: Divide,
  flame: Flame,
  flask: FlaskConical,
  gem: Gem,
  gift: Gift,
  glasses: Glasses,
  globe: Globe,
  "graduation-cap": GraduationCap,
  grid: Grid3x3,
  headphones: Headphones,
  keyboard: Keyboard,
  landmark: Landmark,
  layers: Layers,
  lightbulb: Lightbulb,
  lock: Lock,
  map: MapIcon,
  medal: Medal,
  moon: Moon,
  package: Package,
  play: Play,
  puzzle: Puzzle,
  repeat: Repeat,
  rocket: Rocket,
  "rotate-ccw": RotateCcw,
  satellite: Satellite,
  "shield-check": ShieldCheck,
  smile: Smile,
  snowflake: Snowflake,
  sparkles: Sparkles,
  sprout: Sprout,
  star: Star,
  sunrise: Sunrise,
  swords: Swords,
  target: Target,
  timer: Timer,
  trophy: Trophy,
  wrench: Wrench,
  x: X,
  zap: Zap,
};

/**
 * SVG-иконка по имени из lib/icons.ts. Декоративная по умолчанию: смысл передаёт соседний текст.
 * Цвет — currentColor, размер — через className (size-4 и т.п.).
 */
export function Icon({
  name,
  className,
  strokeWidth = 2,
  label,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
  /** Подпись для скринридера, если иконка без текста рядом */
  label?: string;
}) {
  const Svg = ICONS[name];
  return (
    <Svg
      className={cn("size-4 shrink-0", className)}
      strokeWidth={strokeWidth}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
    />
  );
}
