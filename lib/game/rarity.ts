"use client";

import { useEffect, useState } from "react";
import { supabaseConfig } from "@/lib/supabase/config";
import type { RarityRow } from "@/lib/supabase/database";

/** id достижения → у скольких процентов студентов оно есть */
export type RarityMap = Record<string, number>;

const TTL_MS = 60 * 60 * 1000;
let cache: { at: number; data: RarityMap } | null = null;
let pending: Promise<RarityMap | null> | null = null;

/**
 * Редкость считает SQL-функция achievement_rarity(): она отдаёт только агрегаты, без чужих строк.
 * Запрос идёт прямо в REST Supabase, чтобы гостю не грузить библиотеку supabase-js. Кэш — час.
 */
export async function loadRarity(): Promise<RarityMap | null> {
  if (!supabaseConfig) return null;
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  pending ??= (async () => {
    try {
      const res = await fetch(`${supabaseConfig.url}/rest/v1/rpc/achievement_rarity`, {
        method: "POST",
        headers: {
          apikey: supabaseConfig.key,
          Authorization: `Bearer ${supabaseConfig.key}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      if (!res.ok) return null;
      const rows = (await res.json()) as RarityRow[];
      const data: RarityMap = {};
      for (const row of rows) {
        if (row.total > 0) data[row.achievement_id] = (Number(row.holders) / Number(row.total)) * 100;
      }
      cache = { at: Date.now(), data };
      return data;
    } catch {
      return null;
    } finally {
      pending = null;
    }
  })();
  return pending;
}

export function useRarity(): RarityMap | null {
  const [data, setData] = useState<RarityMap | null>(cache?.data ?? null);
  useEffect(() => {
    let alive = true;
    void loadRarity().then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, []);
  return data;
}

/** «0,9 %», «12 %»: мелкие доли с одним знаком, крупные — целыми */
export function formatRarity(percent: number): string {
  const value = percent < 10 ? Math.max(0.1, Math.round(percent * 10) / 10) : Math.round(percent);
  return `${value.toLocaleString("ru-RU")} %`;
}
