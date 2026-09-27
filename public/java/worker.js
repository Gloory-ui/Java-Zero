// Java-движок в Web Worker: CheerpJ 4.3 (JVM 17 в браузере) + драйвер JavaZeroRunner в библиотечном режиме.
// В воркере бесконечный цикл не замораживает страницу, а зависший движок можно убить terminate().
// /app/ у CheerpJ — корень сайта: public/java/*.jar доступны как /app/java/*.jar (сервер должен поддерживать Range).
/* global importScripts, cheerpjInit, cheerpjRunLibrary, cjGetRuntimeResources */
importScripts("https://cjrtnc.leaningtech.com/4.3/loader.js");

const JAVA = "/app/java/";
const JARS = ["driver.jar", "ecj-3.36.0.jar", "java17-api.jar"];

// Файлы среды CheerpJ, которые нужны компилятору и запуску. Без списка CheerpJ тянет их по кусочку по мере надобности,
// со списком — сразу и параллельно. Получен командой resources после прогрева; обновлять при смене версии CheerpJ.
const PRELOAD = {
  "/lt/17/lib/modules": [
    0, 131072, 1179648, 6291456, 6422528, 6553600, 6684672, 7208960, 7864320, 8519680, 9175040, 9306112, 9437184,
    10092544, 19005440, 19136512, 19660800, 19922944, 37617664, 37748736, 38010880, 38273024,
  ],
  "/lt/etc/users": [0, 131072],
  "/lt/etc/localtime": [],
  "/lt/17/jre/lib/cheerpj-handlers.jar": [0, 131072],
  "/lt/17/jre/lib/cheerpj-awt.jar": [0, 131072],
  "/lt/17/jre/lib/cheerpj-jsobject.jar": [0, 131072],
  "/lt/17/conf/security/java.security": [0, 131072],
};

let runner = null;

const progress = (done, total) => self.postMessage({ type: "progress", done, total });

async function init() {
  // Наши jar грузятся целиком параллельно со средой: дальше CheerpJ читает их кусками уже из кэша браузера
  const jars = Promise.all(JARS.map((jar) => fetch(`/java/${jar}`).then((r) => r.arrayBuffer()))).catch(() => {});
  await cheerpjInit({ version: 17, status: "none", preloadResources: PRELOAD, preloadProgress: progress });
  await jars;
  const lib = await cheerpjRunLibrary(`${JAVA}driver.jar:${JAVA}ecj-3.36.0.jar`);
  runner = await lib.JavaZeroRunner;
  await runner.loadApi(`${JAVA}java17-api.jar`);
  return runner.ping();
}

self.onmessage = async ({ data }) => {
  const { id, op, args = [] } = data;
  try {
    let result;
    if (op === "init") result = await init();
    else if (op === "compile") result = await runner.compile(args[0], args[1]);
    else if (op === "run") result = await runner.run(args[0], args[1]);
    // Служебное: какие файлы среды понадобились — чтобы обновить PRELOAD
    else if (op === "resources") result = cjGetRuntimeResources();
    else throw new Error(`unknown op ${op}`);
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    self.postMessage({ id, ok: false, error: String(error?.message ?? error) });
  }
};
