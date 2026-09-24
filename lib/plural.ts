const rules = new Intl.PluralRules("ru-RU");

/** «1 этап», «2 этапа», «5 этапов»: формы для one, few, many. */
export function plural(n: number, [one, few, many]: readonly [string, string, string]): string {
  const form = rules.select(n);
  return `${n} ${form === "one" ? one : form === "few" ? few : many}`;
}

export const STAGES = ["этап", "этапа", "этапов"] as const;
export const QUESTS = ["квест", "квеста", "квестов"] as const;
