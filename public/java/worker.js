// Java-движок в Web Worker: CheerpJ 4.3 (JVM 17 в браузере) + драйвер JavaZeroRunner в библиотечном режиме.
// В воркере бесконечный цикл не замораживает страницу, а зависший движок можно убить terminate().
// /app/ у CheerpJ — корень сайта: public/java/*.jar доступны как /app/java/*.jar (сервер должен поддерживать Range).
/* global importScripts, cheerpjInit, cheerpjRunLibrary */
importScripts("https://cjrtnc.leaningtech.com/4.3/loader.js");

const JAVA = "/app/java/";
let runner = null;

async function init() {
  await cheerpjInit({ version: 17, status: "none" });
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
    else throw new Error(`unknown op ${op}`);
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    self.postMessage({ id, ok: false, error: String(error?.message ?? error) });
  }
};
