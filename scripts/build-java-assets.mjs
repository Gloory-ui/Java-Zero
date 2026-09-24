// Собирает ресурсы для запуска Java в браузере в public/java/:
//   ecj-3.36.0.jar  — компилятор Eclipse (Maven Central)
//   java17-api.jar  — сигнатуры java.base для Java 17 из ct.sym установленного JDK
//   driver.jar      — java/JavaZeroRunner.java
// Нужен JDK 17+ (javac, jar, java в PATH или JAVA_HOME). Готовые jar-файлы лежат в репозитории:
// на Render при сборке JDK нет, запускать скрипт нужно только после правок в java/.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "java");
const ECJ_VERSION = "3.36.0"; // последняя версия, которой хватает среды Java 17 (у CheerpJ — 17)
const ECJ_URL = `https://repo1.maven.org/maven2/org/eclipse/jdt/ecj/${ECJ_VERSION}/ecj-${ECJ_VERSION}.jar`;

const javaHome = process.env.JAVA_HOME;
const tool = (name) => (javaHome ? join(javaHome, "bin", name) : name);
const run = (cmd, args) => execFileSync(tool(cmd), args, { stdio: "inherit" });

function jdkHome() {
  if (javaHome) return javaHome;
  const settings = execFileSync("java", ["-XshowSettings:properties", "-version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const out = settings || "";
  const line = out.split(/\r?\n/).find((l) => l.includes("java.home"));
  if (line) return line.split("=")[1].trim();
  throw new Error("Не найден JDK: задайте JAVA_HOME");
}

async function fetchOk(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

// Контрольная сумма — та, что публикует Maven Central рядом с артефактом
async function downloadEcj() {
  const file = join(OUT, `ecj-${ECJ_VERSION}.jar`);
  if (!existsSync(file)) writeFileSync(file, Buffer.from(await (await fetchOk(ECJ_URL)).arrayBuffer()));
  const expected = (await (await fetchOk(`${ECJ_URL}.sha1`)).text()).trim().split(/\s+/)[0];
  const actual = createHash("sha1").update(readFileSync(file)).digest("hex");
  if (actual !== expected) {
    rmSync(file);
    throw new Error(`ECJ: sha1 ${actual} не совпадает с Maven Central (${expected}), файл удалён`);
  }
  console.log(`ecj-${ECJ_VERSION}.jar sha1 совпадает с Maven Central`);
  return file;
}

mkdirSync(OUT, { recursive: true });
const ecj = await downloadEcj();

// ct.sym пишет сам java, чтобы не зависеть от JAVA_HOME при запуске через PATH
const home = jdkHome();
run("java", [
  join(ROOT, "java", "tools", "BuildApiJar.java"),
  join(home, "lib", "ct.sym"),
  join(OUT, "java17-api.jar"),
]);

const classes = mkdtempSync(join(tmpdir(), "jz-driver-"));
try {
  run("javac", [
    "--release",
    "17",
    "-encoding",
    "UTF-8",
    "-cp",
    ecj,
    "-d",
    classes,
    join(ROOT, "java", "JavaZeroRunner.java"),
  ]);
  run("jar", ["--create", "--date=2000-01-01T00:00:00Z", "--file", join(OUT, "driver.jar"), "-C", classes, "."]);
} finally {
  rmSync(classes, { recursive: true, force: true });
}
console.log("public/java: ecj, java17-api.jar, driver.jar готовы");
