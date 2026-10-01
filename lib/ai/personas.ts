import type { IconName } from "@/lib/icons";
import type { Persona } from "@/lib/progress/types";

export type PersonaInfo = { id: Persona; icon: IconName; label: string; desc: string };

export const PERSONA_INFO: readonly PersonaInfo[] = [
  {
    id: "chill",
    icon: "smile",
    label: "Сеньор на чилле",
    desc: "Объясняет на жизненных аналогиях, подбадривает и шутит.",
  },
  {
    id: "dushny",
    icon: "glasses",
    label: "Душный препод",
    desc: "Строго по спецификации Java, придирается к терминам.",
  },
  {
    id: "bigtech",
    icon: "briefcase",
    label: "Интервьюер в Бигтех",
    desc: "Коротко и сухо: сложность, граничные случаи, производительность.",
  },
];
