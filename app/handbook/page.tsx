import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CodeBlock } from "@/components/code-block";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Справочник Java",
  description:
    "Шпаргалка по основам Java: типы, деление и остаток, циклы, switch, массивы, Scanner, рекурсия и частые ошибки компилятора.",
};

const SECTIONS = [
  { id: "keys", title: "Горячие клавиши" },
  { id: "types", title: "Типы данных" },
  { id: "division", title: "Деление и остаток" },
  { id: "loops", title: "Циклы" },
  { id: "switch", title: "switch" },
  { id: "arrays", title: "Массивы" },
  { id: "scanner", title: "Scanner" },
  { id: "recursion", title: "Рекурсия" },
  { id: "errors", title: "Ошибки компилятора" },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 flex flex-col gap-4">
      <h2 id={`${id}-title`} className="font-display text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="rounded-md border-l-2 border-gold bg-card px-4 py-3 text-sm leading-relaxed">{children}</p>;
}

function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-sm bg-card-hover px-1.5 py-0.5 font-mono text-[0.9em] [overflow-wrap:anywhere] text-code-text">
      {children}
    </code>
  );
}

const KEYS = [
  ["Ctrl + Enter", "Проверить код тестами (на Mac — Cmd + Enter)"],
  ["sout + Tab", "Разворачивается в System.out.println();"],
  ["psvm + Tab", "Разворачивается в метод main"],
  ["Tab / Shift + Tab", "Отступ в 4 пробела и обратно"],
  ["Ctrl + /", "Закомментировать строку или снять комментарий"],
  ["Ctrl + Z", "Отменить последнее изменение"],
];

const TYPES = [
  ["int", "4 байта", "Целые числа", "int x = 42;"],
  ["long", "8 байт", "Большие целые числа", "long f = 2432902008176640000L;"],
  ["double", "8 байт", "Дробные числа", "double pi = 3.1415;"],
  ["char", "2 байта", "Один символ", "char op = '+';"],
  ["boolean", "не задан спецификацией", "true или false", "boolean isPrime = true;"],
  ["String", "ссылка", "Строка, сам объект живёт в куче", 'String s = "Java";'],
];

const ERRORS = [
  [
    'Syntax error, insert ";" to complete BlockStatements',
    "Нет точки с запятой в конце строки, которую подсветил редактор.",
  ],
  ["x cannot be resolved to a variable", "Переменная не объявлена или объявлена в другом блоке { }. Проверь опечатки."],
  [
    "Type mismatch: cannot convert from double to int",
    "В int кладут дробное число. Поменяй тип или приведи явно: (int) x.",
  ],
  [
    "The local variable x may not have been initialized",
    "Переменную объявили, но не присвоили значение до первого чтения.",
  ],
  [
    "This method must return a result of type long",
    "В методе есть путь, где нет return. Чаще всего забыт базовый случай.",
  ],
  ["Unreachable code", "Строка стоит после return, break или бесконечного цикла и никогда не выполнится."],
];

export default function HandbookPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-12">
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-3xl font-semibold">Справочник Java</h1>
          <p className="text-muted">Шпаргалка по темам курса. Открой рядом с лабораторией, когда забыл синтаксис.</p>
          <nav aria-label="Разделы справочника" className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted transition-colors duration-150 ease-snappy hover:border-border-strong hover:text-text"
              >
                {s.title}
              </a>
            ))}
          </nav>
        </div>

        <Section id="keys" title="Горячие клавиши лаборатории">
          <dl className="grid gap-2 sm:grid-cols-2">
            {KEYS.map(([key, what]) => (
              <div key={key} className="rounded-md border border-border px-4 py-3">
                <dt>
                  <kbd className="font-mono text-sm text-accent">{key}</kbd>
                </dt>
                <dd className="mt-1 text-sm text-muted">{what}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="types" title="Примитивные типы и String">
          <section
            // biome-ignore lint/a11y/noNoninteractiveTabindex: прокручиваемая таблица должна получать фокус (WCAG 2.1.1)
            tabIndex={0}
            aria-label="Таблица типов данных"
            className="overflow-x-auto rounded-md border border-border"
          >
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Тип
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Размер
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Для чего
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Пример
                  </th>
                </tr>
              </thead>
              <tbody>
                {TYPES.map(([type, size, purpose, example]) => (
                  <tr key={type} className="border-t border-border">
                    <th scope="row" className="px-4 py-2 font-mono font-medium text-code-text">
                      {type}
                    </th>
                    <td className="px-4 py-2 whitespace-nowrap text-muted">{size}</td>
                    <td className="px-4 py-2">{purpose}</td>
                    <td className="px-4 py-2 font-mono text-[13px] whitespace-nowrap text-code-text">{example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </Section>

        <Section id="division" title="Деление и остаток">
          <CodeBlock
            code={`int a = 7 / 2;            // 3: int / int отбрасывает дробную часть
double b = 7 / 2;         // 3.0: сначала целое деление, потом перевод в double
double c = 7.0 / 2;       // 3.5: хотя бы один операнд double
double d = (double) 7 / 2; // 3.5: явное приведение типа
int r = 7 % 2;            // 1: остаток от деления
boolean even = n % 2 == 0; // проверка на чётность`}
          />
          <Note>
            Целое деление на ноль (<C>5 / 0</C>) бросает <C>ArithmeticException</C>. Дробное (<C>10.0 / 0</C>) даёт{" "}
            <C>Infinity</C>, поэтому в калькуляторе нужна проверка <C>b == 0</C>.
          </Note>
        </Section>

        <Section id="loops" title="Циклы for и while">
          <CodeBlock
            code={`for (int i = 1; i <= 10; i++) { // 10 итераций: i = 1, 2, ..., 10
    System.out.println(i);
}

int attempts = 0;
while (attempts < 3) { // условие проверяется ДО каждой итерации
    attempts++;
}

for (int i = 1; i <= 50; i++) {
    if (i % 5 == 0) continue; // пропустить остаток итерации
    if (i == 41) break;       // выйти из цикла совсем
    System.out.println(i);
}`}
          />
          <Note>
            Во вложенных циклах внутренний проходит целиком на каждой итерации внешнего. Посмотри трассировку после
            сдачи таблицы умножения в КТ 1.
          </Note>
        </Section>

        <Section id="switch" title="Выбор через switch">
          <CodeBlock
            code={`switch (op) {
    case '+':
        System.out.println(a + b);
        break;
    case '/':
        if (b == 0) {
            System.out.println("Ошибка: деление на ноль!");
        } else {
            System.out.println(a / b);
        }
        break;
    default:
        System.out.println("Неизвестная операция");
}`}
          />
          <Note>
            Без <C>break</C> выполнение «проваливается» в следующий <C>case</C>.
          </Note>
        </Section>

        <Section id="arrays" title="Массивы">
          <CodeBlock
            code={`double[] history = new double[5]; // 5 ячеек, по умолчанию 0.0
history[0] = 10.5;                  // индексы от 0 до length - 1
System.out.println(history.length); // 5
// history[5] = 1; → ArrayIndexOutOfBoundsException`}
          />
        </Section>

        <Section id="scanner" title="Ввод с клавиатуры: Scanner">
          <CodeBlock
            code={`import java.util.Scanner;

Scanner sc = new Scanner(System.in);
int n = sc.nextInt();
double x = sc.nextDouble();
String word = sc.next();       // одно слово до пробела
char op = sc.next().charAt(0); // первый символ слова`}
          />
          <Note>
            В лаборатории Java-Zero дробь вводят через точку: <C>3.5</C>. На компьютере с русской локалью{" "}
            <C>nextDouble()</C> ждёт запятую (<C>3,5</C>), а ввод <C>3.5</C> бросит <C>InputMismatchException</C>. Чтобы
            дома тоже работала точка, создай сканер так: <C>new Scanner(System.in).useLocale(Locale.US)</C> и добавь{" "}
            <C>import java.util.Locale;</C>.
          </Note>
        </Section>

        <Section id="recursion" title="Рекурсия">
          <CodeBlock
            code={`static long factorial(int n) {
    if (n <= 1) return 1;        // базовый случай: останавливает рекурсию
    return n * factorial(n - 1); // рекурсивный шаг
}`}
          />
          <Note>
            Без базового случая вызовы не заканчиваются, и JVM бросает <C>StackOverflowError</C>. В <C>long</C>{" "}
            факториал помещается только до 20!, дальше переполнение.
          </Note>
        </Section>

        <Section id="errors" title="Частые ошибки компилятора">
          <p className="text-sm text-muted">
            Компилятор пишет по-английски. Нажми на ошибку под редактором, чтобы перейти к строке, или спроси
            AI-ментора.
          </p>
          <dl className="flex flex-col gap-2">
            {ERRORS.map(([message, meaning]) => (
              <div key={message} className="rounded-md border border-border px-4 py-3">
                <dt className="font-mono text-[13px] text-danger">{message}</dt>
                <dd className="mt-1 text-sm">{meaning}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
