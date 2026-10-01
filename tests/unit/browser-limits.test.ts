import { describe, expect, it } from "vitest";
import { loadCourse } from "@/lib/content/load";
import { browserLimits } from "@/lib/java/explain";

describe("ограничения браузерной Java", () => {
  it("предупреждает о дописывании в файл: APPEND, FileWriter(f, true), FileOutputStream(f, true)", () => {
    const cases = [
      'Files.writeString(p, "x", StandardOpenOption.CREATE, StandardOpenOption.APPEND);',
      "try (var w = Files.newBufferedWriter(p, APPEND)) { w.write(s); }",
      'try (FileWriter w = new FileWriter("log.txt", true)) { w.write(s); }',
      'var out = new PrintWriter(new FileOutputStream(new File("a.txt"), true));',
    ];
    for (const code of cases) expect(browserLimits(code), code).toHaveLength(1);
  });

  it("не срабатывает на обычной записи, на слове в строке-комментарии и на похожих именах", () => {
    const quiet = [
      "Files.write(p, lines); // раньше тут был APPEND",
      'new FileWriter("a.txt")',
      "boolean appendMode = true; int APPENDIX = 1;",
    ];
    for (const code of quiet) expect(browserLimits(code), code).toHaveLength(0);
  });

  it("эталонные решения курса проходят без предупреждений", () => {
    for (const quest of loadCourse()) {
      for (const stage of quest.stages) {
        expect(browserLimits(stage.solution), `${quest.id}/${stage.id}`).toHaveLength(0);
      }
    }
  });
});
