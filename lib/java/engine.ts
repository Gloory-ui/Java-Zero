"use client";

import { create } from "zustand";
import type { CompileResult, RunResult } from "./judge";

/**
 * Java-движок страницы: Web Worker с CheerpJ (public/java/worker.js).
 * Первая компиляция холодного движка идёт десятки секунд, поэтому движок прогревается в фоне сразу при входе
 * в лабораторию. Задания выполняются по одному; зависший воркер убивается и поднимается заново.
 */
export type EngineStatus = "off" | "booting" | "warming" | "ready" | "busy" | "restarting" | "failed";

type EngineStore = { status: EngineStatus; since: number; error?: string };
export const useEngine = create<EngineStore>(() => ({ status: "off", since: Date.now() }));

const setStatus = (status: EngineStatus, error?: string) => useEngine.setState({ status, since: Date.now(), error });

export class EngineRestartedError extends Error {
  constructor() {
    super("Java-движок завис и перезапускается");
  }
}

// Прогрев: маленькая программа с циклом и Scanner заставляет CheerpJ перевести в свой код нужные части ECJ
const WARMUP_SOURCE = `import java.util.Scanner;
public class Warmup {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        for (int i = 0; i < n; i++) System.out.print(i);
    }
}`;

const INIT_WATCHDOG_MS = 120_000;
const COLD_COMPILE_WATCHDOG_MS = 120_000;
const WARM_COMPILE_WATCHDOG_MS = 20_000;
const RUN_MARGIN_MS = 4_000;

type Pending = {
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

class JavaEngine {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, Pending>();
  private booting: Promise<void> | null = null;
  private warm = false;
  private queue: Promise<unknown> = Promise.resolve();

  /** Поднимает и прогревает движок; повторные вызовы ждут того же запуска. */
  start(): Promise<void> {
    if (!this.booting) {
      this.booting = this.boot().catch((error: unknown) => {
        this.booting = null;
        setStatus("failed", error instanceof Error ? error.message : String(error));
        throw error;
      });
    }
    return this.booting;
  }

  private async boot(): Promise<void> {
    setStatus(this.worker ? "restarting" : "booting");
    this.worker = new Worker("/java/worker.js");
    this.worker.onmessage = ({ data }: MessageEvent<{ id: number; ok: boolean; result?: string; error?: string }>) => {
      const p = this.pending.get(data.id);
      if (!p) return;
      this.pending.delete(data.id);
      clearTimeout(p.timer);
      if (data.ok) p.resolve(data.result ?? "");
      else p.reject(new Error(data.error));
    };
    await this.call("init", [], INIT_WATCHDOG_MS);
    setStatus("warming");
    await this.call("compile", ["Warmup.java", WARMUP_SOURCE], COLD_COMPILE_WATCHDOG_MS);
    await this.call("run", ["3", 2_000], RUN_MARGIN_MS + 2_000);
    this.warm = true;
    setStatus("ready");
  }

  private call(op: string, args: unknown[], watchdogMs: number): Promise<string> {
    const worker = this.worker;
    if (!worker) return Promise.reject(new Error("Java-движок не запущен"));
    const id = ++this.seq;
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new EngineRestartedError());
        this.restart();
      }, watchdogMs);
      this.pending.set(id, { resolve, reject, timer });
      worker.postMessage({ id, op, args });
    });
  }

  /** Убивает воркер (например, программа студента поймала защиту от циклов в catch и крутится дальше). */
  private restart(): void {
    this.worker?.terminate();
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new EngineRestartedError());
    }
    this.pending.clear();
    this.warm = false;
    this.booting = null;
    void this.start().catch(() => {});
  }

  /** Компилирует исходник и запускает его для каждого ввода. Задания выполняются строго по очереди. */
  check(
    fileName: string,
    source: string,
    stdins: string[],
    runTimeoutMs = 3_000,
  ): Promise<{ compile: CompileResult; runs: RunResult[] }> {
    const job = this.queue.then(async () => {
      await this.start();
      setStatus("busy");
      try {
        const compile = JSON.parse(
          await this.call(
            "compile",
            [fileName, source],
            this.warm ? WARM_COMPILE_WATCHDOG_MS : COLD_COMPILE_WATCHDOG_MS,
          ),
        ) as CompileResult;
        let runs: RunResult[] = [];
        if (compile.compiled && stdins.length > 0) {
          const watchdog = runTimeoutMs * stdins.length + RUN_MARGIN_MS;
          runs = JSON.parse(await this.call("run", [stdins.join("\u0000"), runTimeoutMs], watchdog)) as RunResult[];
        }
        return { compile, runs };
      } finally {
        if (useEngine.getState().status === "busy") setStatus("ready");
      }
    });
    this.queue = job.catch(() => {});
    return job;
  }
}

let instance: JavaEngine | null = null;

/** Один движок на вкладку: переживает переходы между этапами. */
export function getEngine(): JavaEngine {
  instance ??= new JavaEngine();
  return instance;
}
