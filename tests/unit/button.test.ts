import { describe, expect, it } from "vitest";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("склеивает классы и отбрасывает пустые значения", () => {
    expect(cn("px-2", false, undefined, "py-1")).toBe("px-2 py-1");
  });

  it("оставляет последнюю из конфликтующих утилит", () => {
    expect(cn("px-2 text-sm", "px-4")).toBe("text-sm px-4");
  });
});

describe("buttonClasses", () => {
  it("по умолчанию даёт основную кнопку среднего размера", () => {
    const classes = buttonClasses();
    expect(classes).toContain("bg-accent-solid");
    expect(classes).toContain("h-10");
  });

  it("сжимает кнопку при нажатии, но не при prefers-reduced-motion", () => {
    const classes = buttonClasses({ variant: "secondary" });
    expect(classes).toContain("active:scale-[0.97]");
    expect(classes).toContain("motion-reduce:active:scale-100");
  });

  it("даёт переопределить размер снаружи", () => {
    const classes = buttonClasses({ size: "lg" }, "h-14");
    expect(classes).toContain("h-14");
    expect(classes).not.toContain("h-12");
  });
});
