import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";
import { StartButton } from "@/components/site/start-button";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { plural, QUESTS, STAGES } from "@/lib/plural";

export const metadata: Metadata = {
  title: { absolute: "Java-Zero — Java с нуля до сданной контрольной" },
  description:
    "Задачи из билетов КТ, настоящий компилятор Java прямо в браузере, защита у профессора на время и AI-ментор, который не решает за тебя. Бесплатно.",
};

// Появление через @starting-style: без JS, короче 300 мс, сдвиг только если пользователь не просил меньше движения
const enter =
  "motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:ease-snappy " +
  "motion-safe:starting:translate-y-2 starting:opacity-0";

const DEMO_CODE = [
  {
    n: 1,
    html: (
      <>
        <K>for</K> (<T>int</T> i = <N>1</N>; i &lt;= <N>10</N>; i++) {"{"}
      </>
    ),
  },
  {
    n: 2,
    html: (
      <>
        {"    "}
        <K>for</K> (<T>int</T> j = <N>1</N>; j &lt;= <N>10</N>; j++) {"{"}
      </>
    ),
  },
  {
    n: 3,
    html: (
      <>
        {"        "}System.out.<F>print</F>(i * j + <S>"\t"</S>);
      </>
    ),
  },
  { n: 4, html: <>{"    }"}</> },
  {
    n: 5,
    html: (
      <>
        {"    "}System.out.<F>println</F>();
      </>
    ),
  },
  { n: 6, html: <>{"}"}</> },
];

const DEMO_TESTS = ["Код компилируется", "Выводит таблицу 10 × 10", "Два вложенных цикла for"];

function K({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--code-keyword)" }}>{children}</span>;
}
function T({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--code-type)" }}>{children}</span>;
}
function N({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--code-number)" }}>{children}</span>;
}
function S({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--code-string)" }}>{children}</span>;
}
function F({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--code-func)" }}>{children}</span>;
}

/** Иллюстрация лаборатории: код из КТ 1 и тесты, которые загораются по очереди. */
function LabPreview() {
  return (
    <figure
      aria-label="Пример: задание из КТ 1 и результат проверки"
      className={`overflow-hidden rounded-xl border border-border-strong bg-code-bg shadow-2xl ${enter} delay-[160ms]`}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 font-mono text-xs text-muted">
        <span className="size-2.5 rounded-full bg-danger/70" />
        <span className="size-2.5 rounded-full bg-gold/70" />
        <span className="size-2.5 rounded-full bg-success/70" />
        <span className="ml-2">KT1.java</span>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed text-code-text">
        {DEMO_CODE.map((line) => (
          <div key={line.n} className="flex gap-4">
            <span className="w-4 shrink-0 text-right select-none" style={{ color: "var(--code-lineno)" }}>
              {line.n}
            </span>
            <span className="whitespace-pre">{line.html}</span>
          </div>
        ))}
      </pre>
      <figcaption className="flex flex-col gap-1.5 border-t border-border px-4 py-3 text-sm">
        {DEMO_TESTS.map((test, i) => (
          <span
            key={test}
            className="flex items-center gap-2 starting:opacity-0 transition-opacity duration-300 ease-snappy"
            style={{ transitionDelay: `${500 + i * 250}ms` }}
          >
            <Icon name="check" className="size-4 text-success" />
            {test}
          </span>
        ))}
        <span
          className="mt-1 font-mono text-xs tracking-widest text-success uppercase starting:opacity-0 transition-opacity duration-300"
          style={{ transitionDelay: "1300ms" }}
        >
          Этап сдан · +70 XP · серия 3 дня
        </span>
      </figcaption>
    </figure>
  );
}

const STEPS = [
  { title: "Теория и грабли", text: "Короткое объяснение темы и ошибки, на которых спотыкаются чаще всего." },
  {
    title: "Код в редакторе",
    text: "Пишешь программу сам. Компилятор Java показывает строку с ошибкой, тесты сверяют вывод программы.",
  },
  {
    title: "Защита у профессора",
    text: "Вопросы на время, как на экзамене. Быстрый верный ответ бьёт критом, ошибки бьют по нервам.",
  },
  {
    title: "Опыт, уровни и квесты дня",
    text: "Этапы, достижения и три квеста дня дают опыт. Растёт уровень, с ним ранг, а серия считает дни подряд.",
  },
];

const FAQ = [
  {
    q: "Это тест с вариантами ответов?",
    a: "Нет. Твой код компилирует и запускает настоящий компилятор Java, а тесты сравнивают вывод программы с ожидаемым.",
  },
  {
    q: "Нейросеть решит всё за меня?",
    a: "AI-ментор объясняет ошибку и даёт намёк, но готовый код не пишет. Эталонное решение открывается после пяти своих попыток.",
  },
  {
    q: "Нужно что-то устанавливать?",
    a: "Нет, всё работает в браузере. Java загружается около полуминуты при первом входе в этап, дальше проверка занимает меньше секунды.",
  },
  {
    q: "Прогресс не пропадёт?",
    a: "Он сохраняется в браузере сразу. Войди в аккаунт, и прогресс откроется на любом устройстве.",
  },
];

export default function Home() {
  const course = toOutline(getCourse());
  const stagesTotal = course.reduce((sum, q) => sum + q.stages.length, 0);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 pt-14 pb-20 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div className="flex flex-col gap-6">
            <p className={`font-mono text-xs tracking-[0.2em] text-gold uppercase ${enter}`}>
              Java с нуля · подготовка к КТ
            </p>
            {/* Заголовок — самый крупный элемент первого экрана (LCP): без анимации появления, иначе Chrome
                не засчитывает его, пока длится переход от opacity 0 */}
            <h1 className="font-display text-4xl leading-tight font-semibold sm:text-5xl">
              Java с нуля до сданной контрольной
            </h1>
            <p className={`text-lg text-muted ${enter} delay-[80ms]`}>
              Задачи из билетов КТ, настоящий компилятор прямо в браузере и защита у профессора на время. Ставить JDK не
              нужно.
            </p>
            <div className={`flex flex-wrap items-center gap-3 ${enter} delay-[120ms]`}>
              <StartButton course={course} />
              <ButtonLink href="/course" variant="ghost" size="lg">
                Карта курса
              </ButtonLink>
            </div>
            <p className={`text-sm text-muted ${enter} delay-[120ms]`}>
              Бесплатно. Регистрация не нужна: прогресс сохранится в браузере.
            </p>
          </div>
          <LabPreview />
        </section>

        <section aria-labelledby="how" className="border-t border-border bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 id="how" className="font-display text-2xl font-semibold">
              Как устроен этап
            </h2>
            {/* Этапы идут по порядку, поэтому это линия времени, а не ряд одинаковых карточек */}
            <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="relative flex flex-col gap-2 border-t border-border-strong pt-5 before:absolute before:-top-px before:left-0 before:h-0.5 before:w-10 before:bg-accent"
                >
                  <span className="font-mono text-xs text-accent">0{i + 1}</span>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="course" className="mx-auto max-w-5xl px-4 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="course" className="font-display text-2xl font-semibold">
                {plural(course.length, QUESTS)}, {plural(stagesTotal, STAGES)}
              </h2>
              <p className="mt-2 text-muted">Квест «Контрольная точка 1» повторяет билет КТ: шесть заданий и защита.</p>
            </div>
            <ButtonLink href="/course" variant="secondary">
              Вся карта курса
            </ButtonLink>
          </div>
          <ol className="mt-8 divide-y divide-border border-y border-border">
            {course.map((quest) => (
              <li key={quest.id} className="flex items-center gap-4 py-4">
                <span className="w-8 shrink-0 font-mono text-xs text-muted">{quest.num}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{quest.title}</span>
                  <span className="block text-sm text-muted">{quest.subtitle}</span>
                </span>
                <span className="hidden shrink-0 text-sm text-muted sm:block">
                  {plural(quest.stages.length, STAGES)}
                </span>
                <span
                  className="shrink-0"
                  title={`Титул за квест: ${quest.rank.title}`}
                  style={{ color: quest.rank.color }}
                >
                  <Icon name={quest.rank.icon} className="size-5" />
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="faq" className="border-t border-border bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 id="faq" className="font-display text-2xl font-semibold">
              Коротко о главном
            </h2>
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              {FAQ.map((item) => (
                <div key={item.q}>
                  <dt className="font-semibold">{item.q}</dt>
                  <dd className="mt-1.5 text-muted">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 py-16">
          <h2 className="font-display text-2xl font-semibold">Начни с переменных</h2>
          <p className="text-muted">Первый этап: четыре строки кода и первый зелёный тест.</p>
          <StartButton course={course} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
