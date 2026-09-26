"use client";

import { useEffect } from "react";
import { prewarmEngine } from "@/lib/java/engine";

/** Начинает прогрев Java-движка заранее, пока студент выбирает этап. Ничего не рисует. */
export function JavaPrewarm() {
  useEffect(() => prewarmEngine(), []);
  return null;
}
