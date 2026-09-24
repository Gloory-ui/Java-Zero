import type { Persona } from "@/lib/progress/types";

export type PersonaInfo = { id: Persona; icon: string; label: string; desc: string };

export const PERSONA_INFO: readonly PersonaInfo[] = [
  {
    id: "chill",
    icon: "😎",
    label: "Сеньор на чилле",
    desc: "Объясняет на жизненных аналогиях, подбадривает и шутит.",
  },
  {
    id: "dushny",
    icon: "🧐",
    label: "Душный препод",
    desc: "Строго по спецификации Java, придирается к терминам.",
  },
  {
    id: "bigtech",
    icon: "💼",
    label: "Интервьюер в Бигтех",
    desc: "Коротко и сухо: сложность, граничные случаи, производительность.",
  },
];
