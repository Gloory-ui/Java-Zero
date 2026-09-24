// Запуск драйвера JavaZeroRunner на локальном JDK — тот же компилятор ECJ и тот же API Java 17, что в браузере
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { CompileResult, RunResult } from "@/lib/java/judge";

const JAVA_DIR = path.join(process.cwd(), "public", "java");
const CLASSPATH = [path.join(JAVA_DIR, "driver.jar"), path.join(JAVA_DIR, "ecj-3.36.0.jar")].join(path.delimiter);
const API_JAR = path.join(JAVA_DIR, "java17-api.jar");
const JAVA = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, "bin", "java") : "java";

export type LocalRun = { compile: CompileResult; run: RunResult[] };

/** Компилирует и запускает программу для каждого ввода. Локаль английская, как у CheerpJ в браузере. */
export function runLocal(fileName: string, source: string, stdins: string[], timeoutMs = 3000): LocalRun {
  const dir = mkdtempSync(path.join(tmpdir(), "jz-run-"));
  try {
    const src = path.join(dir, "source.java");
    writeFileSync(src, source, "utf8");
    const inputs = stdins.map((stdin, i) => {
      const file = path.join(dir, `stdin-${i}.txt`);
      writeFileSync(file, stdin, "utf8");
      return file;
    });
    const out = execFileSync(
      JAVA,
      [
        "-Duser.language=en",
        "-Duser.country=US",
        "-Dfile.encoding=UTF-8",
        "-cp",
        CLASSPATH,
        "JavaZeroRunner",
        "check",
        API_JAR,
        fileName,
        src,
        String(timeoutMs),
        ...inputs,
      ],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
    );
    return JSON.parse(out) as LocalRun;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
