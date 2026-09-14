/**
 * БАЗА ЗНАНИЙ JAVA-ZERO:
 * - basics: Фундамент (память, типы)
 * - loops_prep: Подготовка к КТ 1 (6 этапов)
 * - kt1: Контрольная точка 1 (6 боевых заданий)
 * - calc: Калькулятор (4 этапа)
 */
export const QUESTS = {
  basics: {
    id: "basics",
    num: "00",
    title: "Фундамент Java",
    subTitle: "Память, типы, переменные",
    fileName: "Basics.java",
    stages: [
      {
        id: 0,
        badge: "ЭТАП 01 / 02",
        title: "Коробки памяти: int, double и вывод",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["int a = 10 [4B]", "double b = 2.5 [8B]", "double result = 12.5 [8B]"] }],
          heap: [{ obj: "String Pool", data: '"===" [Static String @0x10A]' }]
        },
        theory: `
          <h3>Как компьютер хранит данные?</h3>
          <p>Компьютерная программа — это манипуляция данными в оперативной памяти (RAM). Переменная — это именованная ячейка в памяти (коробка с ярлыком), куда помещается значение.</p>
          <ul>
            <li><strong>int</strong> — целые числа (4 байта).</li>
            <li><strong>double</strong> — дробные числа (8 байт).</li>
            <li><strong>String</strong> — текст (ссылочный тип, живет в Heap).</li>
          </ul>
          <p><strong>Твой квест:</strong> Создай <code>int a = 10;</code>, <code>double b = 2.5;</code>, <code>double result = a + b;</code> и выведи через <code>System.out.println(result);</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li><strong>= против ==:</strong> Один знак <code>=</code> записывает значение, двойной <code>==</code> сравнивает.</li>
            <li><strong>Точка с запятой:</strong> Каждая команда завершается <code>;</code>.</li>
          </ul>
        `,
        examTest: [
          {
            q: "В чем фундаментальная разница между int и String в памяти JVM?",
            options: [
              "int хранится в куче (Heap), а String в регистрах процессора",
              "int хранит двоичное число прямо на стеке (Stack), а String — адрес объекта в куче (Heap)",
              "Никакой разницы нет, оба типа примитивные",
              "String занимает 4 байта, а int занимает 8 байт"
            ],
            correct: 1,
            explain: "Примитивные типы (int, double) хранятся непосредственно в стековом фрейме. Ссылочные типы (String) хранятся в куче, а на стеке лежит ссылка.",
            advice: "Повтори разницу между стеком и кучей во вкладке «Память RAM»."
          }
        ],
        quiz: {
          question: "Какой тип переменной нужен для хранения числа 3.14?",
          options: ["int", "double", "boolean", "char"],
          correct: 1,
          hint: "Числа с плавающей точкой в Java объявляются типом double."
        },
        starterCode: `public class Basics {
    public static void main(String[] args) {
        // 1. Создай int a = 10;
        
        // 2. Создай double b = 2.5;
        
        // 3. Создай double result = a + b;
        
        // 4. Выведи результат: System.out.println(result);
        
    }
}`,
        solutionCode: `public class Basics {
    public static void main(String[] args) {
        int a = 10;
        double b = 2.5;
        double result = a + b;
        System.out.println(result);
    }
}`,
        hint: 'int a = 10; double b = 2.5; double result = a + b; System.out.println(result);',
        tests: [
          { name: "Класс Basics с main", check: (c) => c.includes("class Basics") && c.includes("main"), expected: "public class Basics { public static void main(String[] args) }" },
          { name: "Объявление int a = 10", check: (c) => /int\s+a\s*=\s*10\s*;/.test(c), expected: "int a = 10;" },
          { name: "Объявление double b = 2.5", check: (c) => /double\s+b\s*=\s*2\.5\s*;/.test(c), expected: "double b = 2.5;" },
          { name: "Сложение result = a + b", check: (c) => /double\s+result\s*=\s*a\s*\+\s*b\s*;/.test(c), expected: "double result = a + b;" },
          { name: "Вывод System.out.println(result)", check: (c) => /System\.out\.println\s*\(\s*result\s*\)\s*;/.test(c), expected: "System.out.println(result);" }
        ],
        interactiveFlow: [
          { prompt: "Введите целое a:", key: "a" },
          { prompt: "Введите дробное b:", key: "b", onDone: (d) => `Результат: ${parseInt(d.a, 10) + parseFloat(d.b)}` }
        ]
      },
      {
        id: 1,
        badge: "ЭТАП 02 / 02",
        title: "Оператор остатка % и деление",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["int rem = 7 % 2 [= 1]"] }],
          heap: [{ obj: "Output", data: '"1"' }]
        },
        theory: `
          <h3>Остаток от деления (%)</h3>
          <p>Оператор <code>%</code> возвращает остаток от целочисленного деления:</p>
          <ul>
            <li><code>7 % 2 == 1</code> (7 = 3 * 2 + <strong>1</strong>)</li>
            <li><code>10 % 5 == 0</code> (число делится нацело)</li>
          </ul>
          <p>Проверка на четность: <code>if (n % 2 == 0)</code>. Проверка кратности 3: <code>if (n % 3 == 0)</code>.</p>
          <p><strong>Твой квест:</strong> Создай переменную <code>int rem = 7 % 2;</code> и выведи её через <code>System.out.println(rem);</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Не путай <code>/</code> (деление) и <code>%</code> (остаток). <code>7 / 2 = 3</code>, а <code>7 % 2 = 1</code>.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Чему равно выражение 14 % 5 в Java?",
            options: ["2.8", "2", "4", "0"],
            correct: 2,
            explain: "14 делим на 5: берем по 2 (это 10), в остатке остается 4 (14 - 10 = 4).",
            advice: "Потренируйся находить остаток от деления в уме."
          }
        ],
        quiz: {
          question: "Как проверить, что число n кратно 5?",
          options: ["n / 5 == 0", "n % 5 == 0", "n % 5 == 1", "n == 5"],
          correct: 1,
          hint: "Если остаток от деления на 5 равен нулю, значит число делится нацело."
        },
        starterCode: `public class Basics {
    public static void main(String[] args) {
        // Создай int rem = 7 % 2;
        
        // Выведи rem:
        
    }
}`,
        solutionCode: `public class Basics {
    public static void main(String[] args) {
        int rem = 7 % 2;
        System.out.println(rem);
    }
}`,
        hint: 'int rem = 7 % 2; System.out.println(rem);',
        tests: [
          { name: "Вычисление остатка 7 % 2", check: (c) => c.includes("7 % 2") || c.includes("7%2"), expected: "int rem = 7 % 2;" },
          { name: "Вывод переменной rem", check: (c) => /System\.out\.println\s*\(\s*rem\s*\)\s*;/.test(c), expected: "System.out.println(rem);" }
        ],
        interactiveFlow: [{ prompt: null, output: "Остаток 7 % 2 равен 1" }]
      }
    ]
  },

  loops_prep: {
    id: "loops_prep",
    num: "01",
    title: "Подготовка к КТ 1",
    subTitle: "Циклы for/while, break, флаги",
    fileName: "LoopsPrep.java",
    stages: [
      {
        id: 0,
        badge: "ПОДГОТОВКА 01 / 06",
        title: "Анатомия цикла for: счетчики и границы",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["int i = 1..10 (Счетчик итераций)"] }],
          heap: [{ obj: "Console Buffer", data: "1 2 3 4 5 6 7 8 9 10" }]
        },
        theory: `
          <h3>Как устроен цикл for</h3>
          <p>Цикл <code>for</code> используется, когда количество повторений известно заранее:</p>
          <pre class="code-inline" style="display:block; padding:8px; margin:8px 0;">
for (int i = 1; i <= 10; i++) {
    System.out.println(i);
}
          </pre>
          <ul>
            <li><code>int i = 1</code> — старт (инициализация счетчика).</li>
            <li><code>i &lt;= 10</code> — условие продолжения (пока true, цикл выполняется).</li>
            <li><code>i++</code> — шаг (увеличение <code>i</code> на 1 после каждого круга).</li>
          </ul>
          <p><strong>Твой квест:</strong> Напиши цикл <code>for</code>, который выводит числа от 1 до 10 построчно.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Написать <code>i &lt; 10</code> вместо <code>i &lt;= 10</code>: в таком случае последнее число 10 не выведется!</li>
          </ul>
        `,
        examTest: [
          {
            q: "Сколько раз выполнится цикл for (int i = 0; i < 5; i++)?",
            options: ["4 раза", "5 раз (для i = 0, 1, 2, 3, 4)", "6 раз", "Бесконечно"],
            correct: 1,
            explain: "Итерации: 0, 1, 2, 3, 4. При i = 5 условие 5 < 5 вернет false, и цикл завершится.",
            advice: "Всегда считай количество итераций с учетом строгого знака неравенства."
          }
        ],
        quiz: {
          question: "Что делает оператор i++ в заголовке цикла?",
          options: ["Уменьшает i на 1", "Увеличивает i на 1", "Умножает i на 2", "Сравнивает i с нулем"],
          correct: 1,
          hint: "i++ — это инкремент (эквивалентно i = i + 1)."
        },
        starterCode: `public class LoopsPrep {
    public static void main(String[] args) {
        // Напиши цикл for от 1 до 10 с выводом System.out.println(i):
        
    }
}`,
        solutionCode: `public class LoopsPrep {
    public static void main(String[] args) {
        for (int i = 1; i <= 10; i++) {
            System.out.println(i);
        }
    }
}`,
        hint: 'for (int i = 1; i <= 10; i++) { System.out.println(i); }',
        tests: [
          { name: "Наличие цикла for", check: (c) => c.includes("for") && c.includes("int i = 1"), expected: "for (int i = 1; i <= 10; i++)" },
          { name: "Верхняя граница 10", check: (c) => c.includes("10"), expected: "i <= 10" },
          { name: "Вывод счетчика i", check: (c) => /System\.out\.println\s*\(\s*i\s*\)\s*;/.test(c), expected: "System.out.println(i);" }
        ],
        interactiveFlow: [{ prompt: null, output: "1\n2\n3\n4\n5\n6\n7\n8\n9\n10" }]
      },

      {
        id: 1,
        badge: "ПОДГОТОВКА 02 / 06",
        title: "Управление итерацией: break и continue",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["i == 15 -> BREAK", "i % 3 == 0 -> CONTINUE"] }],
          heap: [{ obj: "Jump table", data: "Control flow branches" }]
        },
        theory: `
          <h3>Операторы break и continue</h3>
          <ul>
            <li><code>continue</code> — немедленно <strong>пропускает остаток текущего круга</strong> и переходит к следующему <code>i++</code>.</li>
            <li><code>break</code> — немедленно <strong>завершает весь цикл</strong>.</li>
          </ul>
          <pre class="code-inline" style="display:block; padding:8px; margin:8px 0;">
for (int i = 1; i <= 20; i++) {
    if (i == 15) break;        // остановка на 15
    if (i % 2 == 0) continue;  // пропуск четных
    System.out.println(i);
}
          </pre>
          <p><strong>Твой квест:</strong> Напиши цикл от 1 до 20: если число равно 15 — сделай <code>break</code>, если кратно 3 (<code>i % 3 == 0</code>) — сделай <code>continue</code>, иначе выведи число.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Если поставить проверку <code>break</code> ПОСЛЕ вывода <code>System.out.println</code>, стоп-число успеет напечататься. Проверяй условия до вывода!</li>
          </ul>
        `,
        examTest: [
          {
            q: "В чем ключевое различие между continue и break внутри цикла?",
            options: [
              "Разницы нет, оба оператора выходят из программы",
              "continue завершает только текущую итерацию цикла, а break прерывает выполнение всего цикла целиком",
              "break пропускает одно число, а continue завершает цикл",
              "continue используется только в switch, а break только в for"
            ],
            correct: 1,
            explain: "continue перескакивает в конец тела цикла к шагу инкремента, а break передает управление первой строке за пределами цикла.",
            advice: "Запомни: continue = пропуск круга, break = экстренный стоп."
          }
        ],
        quiz: {
          question: "Какой оператор пропускает текущую итерацию цикла?",
          options: ["skip", "break", "continue", "pass"],
          correct: 2,
          hint: "Оператор continue начинает следующий круг цикла."
        },
        starterCode: `public class LoopsPrep {
    public static void main(String[] args) {
        // Цикл от 1 до 20:
        // 1. Если i == 15 -> break;
        // 2. Если i % 3 == 0 -> continue;
        // 3. Выведи i
        
    }
}`,
        solutionCode: `public class LoopsPrep {
    public static void main(String[] args) {
        for (int i = 1; i <= 20; i++) {
            if (i == 15) break;
            if (i % 3 == 0) continue;
            System.out.println(i);
        }
    }
}`,
        hint: 'for (int i = 1; i <= 20; i++) { if (i == 15) break; if (i % 3 == 0) continue; System.out.println(i); }',
        tests: [
          { name: "Проверка i == 15 и break", check: (c) => c.includes("i == 15") && c.includes("break"), expected: "if (i == 15) break;" },
          { name: "Пропуск кратных 3 (i % 3 == 0) и continue", check: (c) => c.includes("i % 3 == 0") && c.includes("continue"), expected: "if (i % 3 == 0) continue;" },
          { name: "Вывод i", check: (c) => c.includes("System.out.println(i)"), expected: "System.out.println(i);" }
        ],
        interactiveFlow: [{ prompt: null, output: "1\n2\n4\n5\n7\n8\n10\n11\n13\n14" }]
      },

      {
        id: 2,
        badge: "ПОДГОТОВКА 03 / 06",
        title: "Переменные-накопители: раздельные суммы",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["int sumEven = 30", "int sumOdd = 25"] }],
          heap: [{ obj: "Output", data: '"Сумма четных: 30\\nСумма нечетных: 25"' }]
        },
        theory: `
          <h3>Накопление суммы в цикле</h3>
          <p>Чтобы посчитать сумму чисел, переменную-аккумулятор создают <strong>ДО цикла</strong>. Внутри цикла к ней прибавляют значение:</p>
          <pre class="code-inline" style="display:block; padding:8px; margin:8px 0;">
int sumEven = 0;
int sumOdd = 0;

for (int i = 1; i <= 10; i++) {
    if (i % 2 == 0) {
        sumEven += i;
    } else {
        sumOdd += i;
    }
}
System.out.println(sumEven);
System.out.println(sumOdd);
          </pre>
          <p><strong>Твой квест:</strong> Посчитай отдельно сумму четных и нечетных чисел от 1 до 10. Выведи сначала <code>sumEven</code>, затем <code>sumOdd</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Создать <code>int sum = 0;</code> внутри фигурных скобок цикла: при каждой итерации переменная будет стираться и создаваться заново!</li>
          </ul>
        `,
        examTest: [
          {
            q: "Что произойдет, если объявить int sum = 0 внутри тела цикла for?",
            options: [
              "Сумма посчитается правильно",
              "На каждом шаге цикла переменная sum будет пересоздаваться и обнуляться, теряя накопленный результат",
              "Компилятор выбросит ошибку дублирования переменной",
              "Переменная сохранится в куче JVM"
            ],
            correct: 1,
            explain: "Область видимости (Scope) переменной внутри цикла ограничена одной итерацией. После закрывающей скобки блока она уничтожается.",
            advice: "Всегда объявляй накопители до начала цикла."
          }
        ],
        quiz: {
          question: "Что означает оператор sum += i?",
          options: ["sum = i", "sum = sum + i", "sum = sum * i", "sum == i"],
          correct: 1,
          hint: "+= прибавляет правое значение к переменной слева."
        },
        starterCode: `public class LoopsPrep {
    public static void main(String[] args) {
        int sumEven = 0;
        int sumOdd = 0;

        // Напиши цикл for от 1 до 10 с накоплением sumEven и sumOdd:
        
        // Выведи sumEven:
        
        // Выведи sumOdd:
        
    }
}`,
        solutionCode: `public class LoopsPrep {
    public static void main(String[] args) {
        int sumEven = 0;
        int sumOdd = 0;

        for (int i = 1; i <= 10; i++) {
            if (i % 2 == 0) {
                sumEven += i;
            } else {
                sumOdd += i;
            }
        }
        System.out.println(sumEven);
        System.out.println(sumOdd);
    }
}`,
        hint: 'for (int i = 1; i <= 10; i++) { if (i % 2 == 0) sumEven += i; else sumOdd += i; } System.out.println(sumEven); System.out.println(sumOdd);',
        tests: [
          { name: "Счетчики sumEven и sumOdd до цикла", check: (c) => c.includes("int sumEven = 0") && c.includes("int sumOdd = 0"), expected: "int sumEven = 0; int sumOdd = 0;" },
          { name: "Проверка четности i % 2 == 0", check: (c) => c.includes("i % 2 == 0"), expected: "if (i % 2 == 0)" },
          { name: "Вывод обеих сумм", check: (c) => c.includes("System.out.println(sumEven)") && c.includes("System.out.println(sumOdd)"), expected: "System.out.println(sumEven); System.out.println(sumOdd);" }
        ],
        interactiveFlow: [{ prompt: null, output: "30\n25" }]
      },

      {
        id: 3,
        badge: "ПОДГОТОВКА 04 / 06",
        title: "Вложенные циклы: сетки и таблицы",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["row i = 1..3", "col j = 1..3"] }],
          heap: [{ obj: "Console Grid", data: "1\\t2\\t3\\n2\\t4\\t6\\n3\\t6\\t9" }]
        },
        theory: `
          <h3>Вложенный цикл</h3>
          <p>Чтобы построить двумерную таблицу (строки и столбцы), используют цикл внутри цикла:</p>
          <ul>
            <li>Внешний цикл <code>for (int i = 1; i &lt;= 3; i++)</code> отвечает за <strong>строки</strong>.</li>
            <li>Внутренний цикл <code>for (int j = 1; j &lt;= 3; j++)</code> отвечает за <strong>столбцы</strong>.</li>
            <li><code>System.out.print(i * j + "\\t")</code> печатает ячейку со знаком табуляции без перевода строки.</li>
            <li><code>System.out.println()</code> вызывается во внешнем цикле для перехода на новую строку.</li>
          </ul>
          <p><strong>Твой квест:</strong> Напиши вложенные циклы от 1 до 3 и выведи мини-таблицу умножения 3x3 через табуляцию <code>\\t</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Не путай <code>System.out.print()</code> (печать в ту же строку) и <code>System.out.println()</code> (печать с переносом строки).</li>
          </ul>
        `,
        examTest: [
          {
            q: "Сколько всего раз выполнится тело внутреннего цикла for (int j = 1; j <= 10; j++), если внешний цикл делает 10 шагов?",
            options: ["20 раз", "100 раз (10 * 10)", "10 раз", "50 раз"],
            correct: 1,
            explain: "На каждый 1 шаг внешнего цикла внутренний делает 10 шагов. 10 * 10 = 100 итераций.",
            advice: "Сложность вложенных циклов перемножается: O(N * M)."
          }
        ],
        quiz: {
          question: "Какой спецсимвол добавляет табуляцию (отступ колонки)?",
          options: ["\\n", "\\t", "\\r", "\\b"],
          correct: 1,
          hint: "\\t означает Tab (табуляция)."
        },
        starterCode: `public class LoopsPrep {
    public static void main(String[] args) {
        // Внешний цикл for (int i = 1; i <= 3; i++)
        // Внутренний цикл for (int j = 1; j <= 3; j++)
        // Печатай System.out.print((i * j) + "\\t");
        // После внутреннего цикла делай System.out.println();
        
    }
}`,
        solutionCode: `public class LoopsPrep {
    public static void main(String[] args) {
        for (int i = 1; i <= 3; i++) {
            for (int j = 1; j <= 3; j++) {
                System.out.print((i * j) + "\\t");
            }
            System.out.println();
        }
    }
}`,
        hint: 'for (int i = 1; i <= 3; i++) { for (int j = 1; j <= 3; j++) { System.out.print((i * j) + "\\t"); } System.out.println(); }',
        tests: [
          { name: "Два вложенных цикла", check: (c) => c.includes("for") && (c.match(/for/g) || []).length >= 2, expected: "for (...) { for (...) { ... } }" },
          { name: "Печать с табуляцией \\t", check: (c) => c.includes("\\t") || c.includes("\\\\t"), expected: 'System.out.print((i * j) + "\\t");' },
          { name: "Перевод строки System.out.println()", check: (c) => c.includes("System.out.println()"), expected: "System.out.println();" }
        ],
        interactiveFlow: [{ prompt: null, output: "1\t2\t3\t\n2\t4\t6\t\n3\t6\t9\t" }]
      },

      {
        id: 4,
        badge: "ПОДГОТОВКА 05 / 06",
        title: "Цикл while и лимит попыток",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["int attempts = 0", "int maxAttempts = 3"] }],
          heap: [{ obj: "Input stream", data: "User guesses" }]
        },
        theory: `
          <h3>Ограничение попыток в цикле while</h3>
          <p>В игре «Угадай число» количество кругов заранее неизвестно, но есть строгий лимит попыток:</p>
          <pre class="code-inline" style="display:block; padding:8px; margin:8px 0;">
int attempts = 0;
int maxAttempts = 3;

while (attempts < maxAttempts) {
    attempts++;
    System.out.println("Попытка: " + attempts);
}
          </pre>
          <p><strong>Твой квест:</strong> Напиши цикл <code>while</code>, который выполняется пока <code>attempts &lt; 3</code>, увеличивает счетчик <code>attempts++</code> и выводит номер попытки.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Забыть написать <code>attempts++</code> внутри цикла: условие <code>attempts &lt; 3</code> всегда останется true, и программа зависнет в бесконечном цикле!</li>
          </ul>
        `,
        examTest: [
          {
            q: "Что произойдет, если в цикле while (attempts < 3) забыть сделать attempts++?",
            options: [
              "Ошибка компиляции",
              "Бесконечный цикл (Infinite Loop), программа намертво зависнет",
              "Цикл выполнится ровно 3 раза",
              "JVM автоматически увеличит переменную"
            ],
            correct: 1,
            explain: "Если переменная в условии цикла не изменяется, условие всегда истинно. Выполнение зациклится.",
            advice: "Всегда проверяй шаг изменения условий в циклах while."
          }
        ],
        quiz: {
          question: "Когда проверяется условие в цикле while?",
          options: ["Перед каждой итерацией", "После каждой итерации", "Только один раз при старте", "В конце программы"],
          correct: 0,
          hint: "while — это цикл с предусловием (проверка идет ДО входа в тело)."
        },
        starterCode: `public class LoopsPrep {
    public static void main(String[] args) {
        int attempts = 0;
        int maxAttempts = 3;

        // Реализуй while (attempts < maxAttempts) с выводом "Попытка " + attempts
        
    }
}`,
        solutionCode: `public class LoopsPrep {
    public static void main(String[] args) {
        int attempts = 0;
        int maxAttempts = 3;

        while (attempts < maxAttempts) {
            attempts++;
            System.out.println("Попытка " + attempts);
        }
    }
}`,
        hint: 'while (attempts < maxAttempts) { attempts++; System.out.println("Попытка " + attempts); }',
        tests: [
          { name: "Наличие цикла while", check: (c) => c.includes("while") && c.includes("attempts < maxAttempts"), expected: "while (attempts < maxAttempts)" },
          { name: "Инкремент attempts++", check: (c) => c.includes("attempts++") || c.includes("attempts +="), expected: "attempts++;" },
          { name: "Вывод номера попытки", check: (c) => c.includes("System.out.println") && c.includes("attempts"), expected: 'System.out.println("Попытка " + attempts);' }
        ],
        interactiveFlow: [{ prompt: null, output: "Попытка 1\nПопытка 2\nПопытка 3" }]
      },

      {
        id: 5,
        badge: "ПОДГОТОВКА 06 / 06",
        title: "Флаги и алгоритм простого числа",
        memorySnapshot: {
          stack: [{ method: "isPrime(7)", vars: ["boolean isPrime = true", "divider = 2..6"] }],
          heap: [{ obj: "Boolean flag", data: "true" }]
        },
        theory: `
          <h3>Как определить простое число?</h3>
          <p><strong>Простое число</strong> — это число больше 1, которое делится без остатка ТОЛЬКО на 1 и на само себя (2, 3, 5, 7, 11...).</p>
          <p>Алгоритм с переменной-флагом (boolean flag):</p>
          <pre class="code-inline" style="display:block; padding:8px; margin:8px 0;">
int n = 7;
boolean isPrime = true; // Предполагаем, что число простое

for (int j = 2; j < n; j++) {
    if (n % j == 0) {
        isPrime = false; // Нашелся делитель!
        break;
    }
}
if (isPrime) System.out.println("Простое");
          </pre>
          <p><strong>Твой квест:</strong> Проверь число <code>n = 7</code> на простоту с помощью цикла от 2 до <code>n - 1</code>. Если простое — выведи <code>"Простое"</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Цикл проверки делителей должен начинаться с <code>j = 2</code>, а не с 1 (ведь на 1 делится любое число).</li>
          </ul>
        `,
        examTest: [
          {
            q: "Почему число 1 не считается простым числом?",
            options: [
              "Потому что 1 — четное число",
              "По математическому определению у простого числа должно быть ровно ДВА различных натуральных делителя (1 и само число)",
              "Это ограничение языка Java",
              "Потому что 1 делится на 0"
            ],
            correct: 1,
            explain: "У единицы только 1 делитель. У простых чисел ровно 2 различных делителя.",
            advice: "Запомни: простые числа начинаются строго с двойки (2, 3, 5...)."
          }
        ],
        quiz: {
          question: "Является ли число 2 простым?",
          options: ["Да, это единственное четное простое число", "Нет, все четные числа составные", "Зависит от JVM", "Только в дробных типах"],
          correct: 0,
          hint: "2 делится только на 1 и на 2, значит оно простое."
        },
        starterCode: `public class LoopsPrep {
    public static void main(String[] args) {
        int n = 7;
        boolean isPrime = true;

        // Напиши проверку делителей for (int j = 2; j < n; j++)
        // Если n % j == 0 -> isPrime = false; break;
        
        // Если isPrime == true -> выведи "Простое"
        
    }
}`,
        solutionCode: `public class LoopsPrep {
    public static void main(String[] args) {
        int n = 7;
        boolean isPrime = true;

        for (int j = 2; j < n; j++) {
            if (n % j == 0) {
                isPrime = false;
                break;
            }
        }
        if (isPrime) {
            System.out.println("Простое");
        }
    }
}`,
        hint: 'for (int j = 2; j < n; j++) { if (n % j == 0) { isPrime = false; break; } } if (isPrime) System.out.println("Простое");',
        tests: [
          { name: "Наличие флага boolean isPrime", check: (c) => c.includes("boolean isPrime"), expected: "boolean isPrime = true;" },
          { name: "Проверка делителей n % j == 0", check: (c) => c.includes("n % j == 0"), expected: "if (n % j == 0) { isPrime = false; break; }" },
          { name: "Вывод 'Простое'", check: (c) => c.includes("Простое"), expected: 'System.out.println("Простое");' }
        ],
        interactiveFlow: [{ prompt: null, output: "Простое" }]
      }
    ]
  },

  kt1: {
    id: "kt1",
    num: "КТ",
    title: "Контрольная точка 1",
    subTitle: "6 аттестационных заданий",
    fileName: "KT1.java",
    stages: [
      {
        id: 0,
        badge: "КТ 1 // ЗАДАНИЕ 01",
        title: "Таблица умножения от 1 до 10",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["row 1..10", "col 1..10"] }],
          heap: [{ obj: "Multiplication Table", data: "10x10 Formatted Matrix" }]
        },
        theory: `
          <h3>Задание 1 (Формулировка из билета)</h3>
          <p><strong>Составить программу, которая выводит таблицу умножения от 1 до 10 в виде форматированной таблицы.</strong></p>
          <p><strong>Требования к выполнению:</strong></p>
          <ul>
            <li>Используй два вложенных цикла <code>for</code> (внешний от 1 до 10, внутренний от 1 до 10).</li>
            <li>Выводи произведения <code>i * j</code> в одну строку через табуляцию <code>\\t</code> (или форматирование <code>%4d</code>).</li>
            <li>После каждой строки делай перевод на новую строку <code>System.out.println()</code>.</li>
          </ul>
        `,
        pitfalls: `
          <h3>Частые грабли на защите</h3>
          <ul>
            <li>Не забывай делать <code>System.out.println()</code> строго между завершением внутреннего цикла и началом следующей строки.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Как обеспечить аккуратное выравнивание столбцов таблицы умножения в консоли?",
            options: [
              "Ставить пробел после каждого числа",
              "Использовать символ табуляции '\\t' или форматированный вывод System.out.printf(\"%4d\", i * j)",
              "Уменьшить размер шрифта в терминале",
              "Использовать тип double вместо int"
            ],
            correct: 1,
            explain: "Символ '\\t' выравнивает позиции по колонкам фиксированной ширины (таб-стопы), предотвращая съезжание таблицы при переходе от однозначных чисел к двузначным.",
            advice: "Покажи преподавателю использование '\\t' или printf."
          }
        ],
        quiz: {
          question: "Сколько всего произведений выведет таблица умножения 10 на 10?",
          options: ["20", "50", "100", "10"],
          correct: 2,
          hint: "10 строк умножить на 10 колонок = 100 значений."
        },
        starterCode: `public class KT1 {
    public static void main(String[] args) {
        // Задание 1. Таблица умножения от 1 до 10 в виде форматированной таблицы
        
    }
}`,
        solutionCode: `public class KT1 {
    public static void main(String[] args) {
        for (int i = 1; i <= 10; i++) {
            for (int j = 1; j <= 10; j++) {
                System.out.print((i * j) + "\\t");
            }
            System.out.println();
        }
    }
}`,
        hint: 'for (int i = 1; i <= 10; i++) { for (int j = 1; j <= 10; j++) { System.out.print((i * j) + "\\t"); } System.out.println(); }',
        tests: [
          { name: "Два вложенных цикла от 1 до 10", check: (c) => c.includes("10") && (c.match(/for/g) || []).length >= 2, expected: "for (int i=1; i<=10; i++) { for (int j=1; j<=10; j++) }" },
          { name: "Вычисление i * j", check: (c) => c.includes("i * j") || c.includes("i*j") || c.includes("j * i"), expected: "i * j" },
          { name: "Форматированный вывод (\\t или printf)", check: (c) => c.includes("\\t") || c.includes("printf") || c.includes("\\\\t"), expected: "System.out.print(... + \"\\t\");" },
          { name: "Перевод строки System.out.println()", check: (c) => c.includes("System.out.println()"), expected: "System.out.println();" }
        ],
        interactiveFlow: [{ prompt: null, output: "1\t2\t3\t4\t5\t6\t7\t8\t9\t10\t\n2\t4\t6\t8\t10\t12\t14\t16\t18\t20\t\n...\n10\t20\t30\t40\t50\t60\t70\t80\t90\t100\t" }]
      },

      {
        id: 1,
        badge: "КТ 1 // ЗАДАНИЕ 02",
        title: "Числа 1..50 без кратных 5 и 7, стоп на 41",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["for i = 1..50", "Stop: i == 41", "Skip: i % 5 == 0 || i % 7 == 0"] }],
          heap: [{ obj: "Console Log", data: "Filtered stream" }]
        },
        theory: `
          <h3>Задание 2 (Формулировка из билета)</h3>
          <p><strong>Вывести числа 1..50, пропуская кратные 5 и 7. При достижении 41 завершить вывод.</strong></p>
          <p><strong>Требования к выполнению:</strong></p>
          <ul>
            <li>Цикл <code>for</code> от 1 до 50.</li>
            <li>Если <code>i == 41</code> — оператор <code>break;</code> (остановить выполнение).</li>
            <li>Если число кратно 5 или 7 (<code>i % 5 == 0 || i % 7 == 0</code>) — оператор <code>continue;</code> (пропустить).</li>
            <li>Остальные числа вывести в консоль через <code>System.out.println(i);</code>.</li>
          </ul>
        `,
        pitfalls: `
          <h3>Частые грабли на защите</h3>
          <ul>
            <li>Проверку <code>if (i == 41) break;</code> нужно делать <strong>до</strong> проверки на кратность и до вывода.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Почему при достижении числа 41 цикл завершается и 41 не выводится?",
            options: [
              "Потому что 41 кратно 5",
              "Потому что условие if (i == 41) break срабатывает до инструкции вывода System.out.println",
              "В Java нельзя выводить простые числа",
              "Это особенность компилятора"
            ],
            correct: 1,
            explain: "Когда i становится равным 41, оператор break немедленно прерывает цикл, поэтому 41 на экран не попадает.",
            advice: "Четко объясни преподавателю порядок выполнения строк в теле цикла."
          }
        ],
        quiz: {
          question: "Будет ли выведено число 35 в этом задании?",
          options: ["Да", "Нет, так как 35 кратно 5 и 7 (сработает continue)", "Вызовет ошибку", "Завершит цикл"],
          correct: 1,
          hint: "35 делится и на 5, и на 7 без остатка."
        },
        starterCode: `public class KT1 {
    public static void main(String[] args) {
        // Задание 2. Вывести числа 1..50, пропуская кратные 5 и 7. При достижении 41 завершить вывод.
        
    }
}`,
        solutionCode: `public class KT1 {
    public static void main(String[] args) {
        for (int i = 1; i <= 50; i++) {
            if (i == 41) {
                break;
            }
            if (i % 5 == 0 || i % 7 == 0) {
                continue;
            }
            System.out.println(i);
        }
    }
}`,
        hint: 'for (int i = 1; i <= 50; i++) { if (i == 41) break; if (i % 5 == 0 || i % 7 == 0) continue; System.out.println(i); }',
        tests: [
          { name: "Цикл for до 50", check: (c) => c.includes("for") && c.includes("50"), expected: "for (int i = 1; i <= 50; i++)" },
          { name: "Прерывание на 41 (break)", check: (c) => c.includes("41") && c.includes("break"), expected: "if (i == 41) break;" },
          { name: "Пропуск кратных 5 и 7 (continue)", check: (c) => c.includes("% 5 == 0") && c.includes("% 7 == 0") && c.includes("continue"), expected: "if (i % 5 == 0 || i % 7 == 0) continue;" },
          { name: "Вывод System.out.println", check: (c) => c.includes("System.out.println(i)"), expected: "System.out.println(i);" }
        ],
        interactiveFlow: [{ prompt: null, output: "1\n2\n3\n4\n6\n8\n9\n11\n12\n13\n...\n39\n[Цикл завершен на 41]" }]
      },

      {
        id: 2,
        badge: "КТ 1 // ЗАДАНИЕ 03",
        title: "Числа от 1 до 30: Четность и кратность 3",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["i % 2 == 0 && i % 3 == 0 -> 'N Четное и кратное 3'"] }],
          heap: [{ obj: "String Formats", data: "Conditional strings" }]
        },
        theory: `
          <h3>Задание 3 (Формулировка из билета)</h3>
          <p><strong>Составить программу, которая выводит числа от 1 до 30: если число кратно 2 — выводить «N Четное», если кратно 3 — «N Кратное 3», если кратно и 2, и 3 — «N Четное и кратное 3», иначе — выводить само число. Использовать for и if-else.</strong></p>
          <p><strong>Главный подвох:</strong> Проверку на кратность <strong>одновременно 2 и 3</strong> (<code>i % 2 == 0 && i % 3 == 0</code>) нужно ставить <strong>САМОЙ ПЕРВОЙ</strong> в цепочке <code>if-else</code>! Иначе число 6 попадет в ветку «Четное» и никогда не дойдет до совместной проверки.</p>
        `,
        pitfalls: `
          <h3>Частые грабли на защите</h3>
          <ul>
            <li>Если первым условием написать <code>if (i % 2 == 0)</code>, то числа 6, 12, 18, 24, 30 выведутся просто как «Четное»!</li>
          </ul>
        `,
        examTest: [
          {
            q: "Почему условие (i % 2 == 0 && i % 3 == 0) обязано стоять первым в конструкции if-else?",
            options: [
              "Потому что логическое 'И' выполняется быстрее",
              "Потому что если поставить первым (i % 2 == 0), условие выполнится для числа 6, управление выйдет из if-else, и до двойной проверки код никогда не дойдет",
              "Это требование стандарта Java",
              "Иначе компилятор выдаст ошибку unreachable code"
            ],
            correct: 1,
            explain: "В цепочке if - else if выполняется только ПЕРВАЯ истинная ветка. Более строгие составные условия всегда должны стоять раньше частных.",
            advice: "Всегда ставь составные проверки выше простых."
          }
        ],
        quiz: {
          question: "Что программа должна вывести для числа 6?",
          options: ["6 Четное", "6 Кратное 3", "6 Четное и кратное 3", "6"],
          correct: 2,
          hint: "6 делится и на 2, и на 3."
        },
        starterCode: `public class KT1 {
    public static void main(String[] args) {
        // Задание 3. Числа от 1 до 30.
        // если кратно и 2, и 3 — «N Четное и кратное 3»
        // если кратно 2 — «N Четное»
        // если кратно 3 — «N Кратное 3»
        // иначе — само число
        
    }
}`,
        solutionCode: `public class KT1 {
    public static void main(String[] args) {
        for (int i = 1; i <= 30; i++) {
            if (i % 2 == 0 && i % 3 == 0) {
                System.out.println(i + " Четное и кратное 3");
            } else if (i % 2 == 0) {
                System.out.println(i + " Четное");
            } else if (i % 3 == 0) {
                System.out.println(i + " Кратное 3");
            } else {
                System.out.println(i);
            }
        }
    }
}`,
        hint: 'for (int i = 1; i <= 30; i++) { if (i % 2 == 0 && i % 3 == 0) System.out.println(i + " Четное и кратное 3"); else if (i % 2 == 0) System.out.println(i + " Четное"); else if (i % 3 == 0) System.out.println(i + " Кратное 3"); else System.out.println(i); }',
        tests: [
          { name: "Цикл for от 1 до 30", check: (c) => c.includes("for") && c.includes("30"), expected: "for (int i = 1; i <= 30; i++)" },
          { name: "Проверка совместной кратности (i % 2 == 0 && i % 3 == 0)", check: (c) => (c.includes("i % 2 == 0") && c.includes("i % 3 == 0")) || c.includes("i % 6 == 0"), expected: "i % 2 == 0 && i % 3 == 0" },
          { name: "Точный текст «Четное и кратное 3»", check: (c) => c.includes("Четное и кратное 3"), expected: 'System.out.println(i + " Четное и кратное 3");' },
          { name: "Точный текст «Четное» и «Кратное 3»", check: (c) => c.includes("Четное") && c.includes("Кратное 3"), expected: 'if-else ветки' }
        ],
        interactiveFlow: [{ prompt: null, output: "1\n2 Четное\n3 Кратное 3\n4 Четное\n5\n6 Четное и кратное 3\n..." }]
      },

      {
        id: 3,
        badge: "КТ 1 // ЗАДАНИЕ 04",
        title: "Числа от 1 до 20 с суммами четных и нечетных",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["sumEven = 110", "sumOdd = 100"] }],
          heap: [{ obj: "Console Output", data: "Logged numbers and final sums" }]
        },
        theory: `
          <h3>Задание 4 (Формулировка из билета)</h3>
          <p><strong>Составить программу, которая выводит числа от 1 до 20 и отмечает, являются ли они чётными или нечётными. Отдельно сложить все четные и все нечетные, вывести эти суммы на консоли. Использовать любой цикл и if-else.</strong></p>
          <p><strong>Алгоритм:</strong></p>
          <ul>
            <li>Создай накопители: <code>int sumEven = 0, sumOdd = 0;</code></li>
            <li>Цикл от 1 до 20: проверяй <code>if (i % 2 == 0)</code>, печатай отметку и прибавляй <code>sumEven += i;</code>, иначе в <code>sumOdd += i;</code>.</li>
            <li>После завершения цикла выведи обе суммы.</li>
          </ul>
        `,
        pitfalls: `
          <h3>Частые грабли на защите</h3>
          <ul>
            <li>Сумма четных от 1 до 20 равна <strong>110</strong>. Сумма нечетных равна <strong>100</strong>. Убедись, что числа 1 и 20 включены в расчет.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Чему равны сумма всех четных и сумма всех нечетных чисел в диапазоне от 1 до 20 включительно?",
            options: [
              "Четные: 110, Нечетные: 100",
              "Четные: 100, Нечетные: 100",
              "Четные: 90, Нечетные: 110",
              "Четные: 210, Нечетные: 0"
            ],
            correct: 0,
            explain: "Четные: 2+4+6+8+10+12+14+16+18+20 = 110. Нечетные: 1+3+5+7+9+11+13+15+17+19 = 100.",
            advice: "Проверь свои суммы перед показом преподавателю."
          }
        ],
        quiz: {
          question: "Как определить, что число i является нечетным?",
          options: ["i % 2 != 0", "i / 2 == 1", "i == 3", "i % 3 == 0"],
          correct: 0,
          hint: "Остаток от деления на 2 не равен нулю."
        },
        starterCode: `public class KT1 {
    public static void main(String[] args) {
        // Задание 4. Числа от 1 до 20, отметка четное/нечетное и раздельные суммы:
        int sumEven = 0;
        int sumOdd = 0;

        
    }
}`,
        solutionCode: `public class KT1 {
    public static void main(String[] args) {
        int sumEven = 0;
        int sumOdd = 0;

        for (int i = 1; i <= 20; i++) {
            if (i % 2 == 0) {
                System.out.println(i + " - четное");
                sumEven += i;
            } else {
                System.out.println(i + " - нечетное");
                sumOdd += i;
            }
        }

        System.out.println("Сумма четных: " + sumEven);
        System.out.println("Сумма нечетных: " + sumOdd);
    }
}`,
        hint: 'for (int i = 1; i <= 20; i++) { if (i % 2 == 0) { System.out.println(i + " четное"); sumEven += i; } else { System.out.println(i + " нечетное"); sumOdd += i; } } System.out.println("Сумма четных: " + sumEven); System.out.println("Сумма нечетных: " + sumOdd);',
        tests: [
          { name: "Цикл от 1 до 20", check: (c) => c.includes("20"), expected: "for (int i = 1; i <= 20; i++)" },
          { name: "Накопление sumEven и sumOdd", check: (c) => c.includes("sumEven") && c.includes("sumOdd") && (c.includes("+=") || c.includes("=")), expected: "sumEven += i; sumOdd += i;" },
          { name: "Проверка четности (i % 2 == 0)", check: (c) => c.includes("% 2 == 0") || c.includes("% 2 != 0"), expected: "if (i % 2 == 0)" },
          { name: "Вывод обеих итоговых сумм", check: (c) => c.includes("System.out.println") && c.includes("sumEven") && c.includes("sumOdd"), expected: "Вывод сумм на консоль" }
        ],
        interactiveFlow: [{ prompt: null, output: "1 - нечетное\n2 - четное\n...\nСумма четных: 110\nСумма нечетных: 100" }]
      },

      {
        id: 4,
        badge: "КТ 1 // ЗАДАНИЕ 05",
        title: "Игра «Угадай число» с лимитом попыток",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["int target = 42", "int attempts = 5", "guess < target -> больше"] }],
          heap: [{ obj: "Scanner", data: "Interactive console stream" }]
        },
        theory: `
          <h3>Задание 5 (Формулировка из билета)</h3>
          <p><strong>Реализовать игру «Угадай число». Программа загадывает число, вы вводите догадки, после каждой попытки выводится подсказка «больше» или «меньше». Ограничить число попыток.</strong></p>
          <p><strong>Архитектура решения:</strong></p>
          <ul>
            <li>Загадай число (например, <code>int target = 42;</code> или через <code>(int)(Math.random() * 100) + 1</code>).</li>
            <li>Задай лимит: <code>int maxAttempts = 5;</code> и счетчик <code>int attempts = 0;</code>.</li>
            <li>В цикле <code>while (attempts &lt; maxAttempts)</code> считывай догадку <code>int guess = sc.nextInt();</code>:
              <ul>
                <li>Если <code>guess == target</code>: выведи «Угадал!» и сделай <code>break;</code></li>
                <li>Если <code>guess &lt; target</code>: выведи «больше»</li>
                <li>Если <code>guess &gt; target</code>: выведи «меньше»</li>
              </ul>
            </li>
          </ul>
        `,
        pitfalls: `
          <h3>Частые грабли на защите</h3>
          <ul>
            <li>Подсказка «больше» означает: «загаданное число <strong>больше</strong> твоего ввода» (<code>target &gt; guess</code>).</li>
          </ul>
        `,
        examTest: [
          {
            q: "Какой цикл лучше всего подходит для игры 'Угадай число' с ограничением попыток?",
            options: [
              "Только бесконечный цикл без условий",
              "while (attempts < maxAttempts) или for (int i = 1; i <= maxAttempts; i++) с прерыванием break при победе",
              "Рекурсия без базового случая",
              "Оператор switch"
            ],
            correct: 1,
            explain: "Цикл while или for с ограничением по счетчику гарантирует, что программа завершится, даже если пользователь не угадал число.",
            advice: "Объясни преподавателю условие остановки цикла."
          }
        ],
        quiz: {
          question: "Что выводит программа, если пользователь ввел 20, а загадано 50?",
          options: ["меньше", "больше", "ошибка", "выход"],
          correct: 1,
          hint: "Загаданное число 50 больше введенного 20, поэтому подсказка: «больше»."
        },
        starterCode: `import java.util.Scanner;

public class KT1 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int target = 42; // Загаданное число
        int maxAttempts = 5;
        int attempts = 0;

        // Реализуй игру «Угадай число» с подсказками "больше", "меньше" и ограничением попыток:
        
    }
}`,
        solutionCode: `import java.util.Scanner;

public class KT1 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int target = 42;
        int maxAttempts = 5;
        int attempts = 0;

        while (attempts < maxAttempts) {
            attempts++;
            int guess = sc.nextInt();

            if (guess == target) {
                System.out.println("Угадал!");
                break;
            } else if (guess < target) {
                System.out.println("больше");
            } else {
                System.out.println("меньше");
            }
        }
    }
}`,
        hint: 'while (attempts < maxAttempts) { attempts++; int guess = sc.nextInt(); if (guess == target) { System.out.println("Угадал!"); break; } else if (guess < target) System.out.println("больше"); else System.out.println("меньше"); }',
        tests: [
          { name: "Использование Scanner для ввода", check: (c) => c.includes("Scanner") && (c.includes("nextInt()") || c.includes("next()")), expected: "sc.nextInt()" },
          { name: "Ограничение числа попыток", check: (c) => c.includes("maxAttempts") || c.includes("attempts <") || c.includes("attempts <="), expected: "attempts < maxAttempts" },
          { name: "Подсказка 'больше'", check: (c) => c.includes("больше"), expected: 'System.out.println("больше");' },
          { name: "Подсказка 'меньше'", check: (c) => c.includes("меньше"), expected: 'System.out.println("меньше");' }
        ],
        interactiveFlow: [
          { prompt: "Загадано 42. Ваша догадка 1:", key: "g1", onDone: (d) => parseInt(d.g1, 10) < 42 ? "больше" : (parseInt(d.g1, 10) > 42 ? "меньше" : "Угадал!") },
          { prompt: "Ваша догадка 2:", key: "g2", onDone: (d) => parseInt(d.g2, 10) === 42 ? "Угадал!" : (parseInt(d.g2, 10) < 42 ? "больше" : "меньше") }
        ]
      },

      {
        id: 5,
        badge: "КТ 1 // ЗАДАНИЕ 06",
        title: "Простые числа от 2 до N и их подсчет",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["int N = 20", "int count = 8 (2, 3, 5, 7, 11, 13, 17, 19)"] }],
          heap: [{ obj: "Primes Buffer", data: "2 3 5 7 11 13 17 19" }]
        },
        theory: `
          <h3>Задание 6 (Формулировка из билета)</h3>
          <p><strong>Написать программу, которая выводит все простые числа от 2 до N, и дополнительно считает количество найденных чисел.</strong></p>
          <p><strong>Архитектура двух уровней:</strong></p>
          <ul>
            <li>Внешний цикл <code>for (int i = 2; i &lt;= n; i++)</code> перебирает всех кандидатов.</li>
            <li>Внутренний цикл проверяет делители: <code>for (int j = 2; j * j &lt;= i; j++)</code> (или <code>j &lt; i</code>).</li>
            <li>Если <code>i % j == 0</code>, то число составное (<code>isPrime = false; break;</code>).</li>
            <li>Если после проверки <code>isPrime == true</code> — выводим число и увеличиваем счетчик: <code>count++;</code>.</li>
            <li>В конце печатаем итоговое количество <code>count</code>.</li>
          </ul>
        `,
        pitfalls: `
          <h3>Частые грабли на защите</h3>
          <ul>
            <li>Переменная <code>boolean isPrime = true;</code> должна сбрасываться в <code>true</code> <strong>внутри внешнего цикла</strong> перед проверкой каждого нового числа!</li>
          </ul>
        `,
        examTest: [
          {
            q: "Почему оптимизация проверки делителей до корня (j * j <= i) ускоряет поиск простых чисел?",
            options: [
              "Потому что корень числа вычисляется без использования RAM",
              "Если у числа есть делитель больше его квадратного корня, то парный ему делитель обязательно меньше корня, и мы уже проверили его ранее",
              "Она не ускоряет, это миф",
              "Компилятор Java автоматически заменяет все циклы на корень"
            ],
            correct: 1,
            explain: "Любой делитель d > sqrt(n) имеет пару n/d < sqrt(n). Проверять числа выше корня математически бессмысленно.",
            advice: "Поделись этим фактом перед преподавателем!"
          }
        ],
        quiz: {
          question: "Сколько простых чисел находится в диапазоне от 2 до 10?",
          options: ["3", "4 (это 2, 3, 5, 7)", "5", "2"],
          correct: 1,
          hint: "Простые числа до 10: 2, 3, 5, 7."
        },
        starterCode: `import java.util.Scanner;

public class KT1 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int count = 0;

        // Задание 6. Написать программу, которая выводит все простые числа от 2 до N,
        // и дополнительно считает количество найденных чисел.
        
    }
}`,
        solutionCode: `import java.util.Scanner;

public class KT1 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int count = 0;

        for (int i = 2; i <= n; i++) {
            boolean isPrime = true;
            for (int j = 2; j < i; j++) {
                if (i % j == 0) {
                    isPrime = false;
                    break;
                }
            }
            if (isPrime) {
                System.out.print(i + " ");
                count++;
            }
        }
        System.out.println();
        System.out.println("Количество простых чисел: " + count);
    }
}`,
        hint: 'for (int i = 2; i <= n; i++) { boolean isPrime = true; for (int j = 2; j < i; j++) { if (i % j == 0) { isPrime = false; break; } } if (isPrime) { System.out.print(i + " "); count++; } } System.out.println("Количество простых чисел: " + count);',
        tests: [
          { name: "Внешний цикл от 2 до N", check: (c) => c.includes("for") && (c.includes("i = 2") || c.includes("2")), expected: "for (int i = 2; i <= n; i++)" },
          { name: "Флаг isPrime и проверка делителей", check: (c) => c.includes("isPrime") && c.includes("%"), expected: "boolean isPrime; if (i % j == 0)" },
          { name: "Счетчик count++", check: (c) => c.includes("count++") || c.includes("count +="), expected: "count++;" },
          { name: "Итоговый вывод количества", check: (c) => c.includes("System.out.println") && c.includes("count"), expected: "Вывод count" }
        ],
        interactiveFlow: [
          { prompt: "Введите N (например, 20):", key: "n", onDone: (d) => {
            const n = parseInt(d.n, 10);
            let primes = [];
            for (let i = 2; i <= n; i++) {
              let ok = true;
              for (let j = 2; j * j <= i; j++) { if (i % j === 0) { ok = false; break; } }
              if (ok) primes.push(i);
            }
            return `${primes.join(" ")}\nКоличество простых чисел: ${primes.length}`;
          }}
        ]
      }
    ]
  },

  calc: {
    id: "calc",
    num: "02",
    title: "Калькулятор",
    subTitle: "Массивы, switch, рекурсия",
    fileName: "Calculator.java",
    stages: [
      {
        id: 0,
        badge: "ЭТАП 01 / 04",
        title: "Базовый каркас и заставка",
        memorySnapshot: {
          stack: [{ method: "main(String[] args)", vars: ["args = @0x01 [len: 0]"] }],
          heap: [{ obj: "String Pool", data: '"=== КАЛЬКУЛЯТОР ЗАПУЩЕН ==="' }]
        },
        theory: `
          <h3>Архитектура программы</h3>
          <p>В Java любой код упаковывается в класс. Метод <code>public static void main(String[] args)</code> служит точкой входа.</p>
          <p><strong>Твой квест:</strong> Напиши класс <code>Calculator</code> с методом <code>main</code>, выводящим <code>"=== КАЛЬКУЛЯТОР ЗАПУЩЕН ==="</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Имя файла <code>Calculator.java</code> обязано точно совпадать с именем класса.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Почему метод main объявлен как static?",
            options: [
              "Чтобы работать быстрее",
              "Чтобы JVM могла вызвать его без создания объекта через new",
              "Это устаревшее требование",
              "Чтобы запретить вызовы из других классов"
            ],
            correct: 1,
            explain: "static позволяет JVM вызвать метод main без создания экземпляра класса в куче.",
            advice: "Повтори разницу между статическими и нестатическими методами."
          }
        ],
        quiz: {
          question: "Какая сигнатура является точкой входа в Java?",
          options: ["function main()", "public static void main(String[] args)", "void start()", "public void run()"],
          correct: 1,
          hint: "public static void main(String[] args)"
        },
        starterCode: `public class Calculator {
    public static void main(String[] args) {
        // Выведи: "=== КАЛЬКУЛЯТОР ЗАПУЩЕН ==="
        
    }
}`,
        solutionCode: `public class Calculator {
    public static void main(String[] args) {
        System.out.println("=== КАЛЬКУЛЯТОР ЗАПУЩЕН ===");
    }
}`,
        hint: 'System.out.println("=== КАЛЬКУЛЯТОР ЗАПУЩЕН ===");',
        tests: [
          { name: "Класс Calculator", check: (c) => c.includes("class Calculator"), expected: "public class Calculator" },
          { name: "Сигнатура main", check: (c) => /public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*args\s*\)/.test(c), expected: "public static void main(String[] args)" },
          { name: "Вывод заставки", check: (c) => c.includes("=== КАЛЬКУЛЯТОР ЗАПУЩЕН ==="), expected: 'System.out.println("=== КАЛЬКУЛЯТОР ЗАПУЩЕН ===");' }
        ],
        interactiveFlow: [{ prompt: null, output: "=== КАЛЬКУЛЯТОР ЗАПУЩЕН ===" }]
      },
      {
        id: 1,
        badge: "ЭТАП 02 / 04",
        title: "Конструкция switch и защита от 0",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["char op = '/'", "num2 == 0 -> Error"] }],
          heap: [{ obj: "Jump Table", data: "Switch binary offsets" }]
        },
        theory: `
          <h3>Ветвление логики через switch</h3>
          <p>В калькуляторе арифметическую операцию определяют через <code>switch (op)</code>. При делении на ноль обязательно проверяй <code>if (num2 == 0)</code>!</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>В double деление на ноль дает <code>Infinity</code>, а не ошибку, поэтому проверка <code>num2 == 0</code> строго обязательна.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Что вернет операция 10.0 / 0.0 в Java?",
            options: ["ArithmeticException", "Infinity по стандарту IEEE 754", "0", "NaN"],
            correct: 1,
            explain: "Вещественные числа в Java следуют стандарту IEEE 754, где деление ненулевого числа на 0.0 дает Infinity.",
            advice: "Всегда помни об особенности IEEE 754 для double."
          }
        ],
        quiz: {
          question: "Что предотвращает эффект 'проваливания' в конструкции switch?",
          options: ["continue", "break", "default", "return 0"],
          correct: 1,
          hint: "Оператор break останавливает выполнение дальнейших case."
        },
        starterCode: `import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double a = sc.nextDouble();
        char op = sc.next().charAt(0);
        double b = sc.nextDouble();

        switch (op) {
            case '+': System.out.println(a + b); break;
            case '-': System.out.println(a - b); break;
            case '*': System.out.println(a * b); break;
            case '/':
                // Добавь проверку b == 0:
                break;
        }
    }
}`,
        solutionCode: `import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double a = sc.nextDouble();
        char op = sc.next().charAt(0);
        double b = sc.nextDouble();

        switch (op) {
            case '+': System.out.println(a + b); break;
            case '-': System.out.println(a - b); break;
            case '*': System.out.println(a * b); break;
            case '/':
                if (b == 0) {
                    System.out.println("Ошибка: деление на ноль!");
                } else {
                    System.out.println(a / b);
                }
                break;
        }
    }
}`,
        hint: 'case \'/\': if (b == 0) System.out.println("Ошибка: деление на ноль!"); else System.out.println(a / b); break;',
        tests: [
          { name: "Конструкция switch (op)", check: (c) => c.includes("switch (op)") || c.includes("switch(op)"), expected: "switch (op)" },
          { name: "Защита от нуля if (b == 0)", check: (c) => c.includes("b == 0") || c.includes("0 == b"), expected: "if (b == 0)" }
        ],
        interactiveFlow: [
          { prompt: "Введите a, знак, b:", key: "in", onDone: () => "Результат вычислен" }
        ]
      },
      {
        id: 2,
        badge: "ЭТАП 03 / 04",
        title: "Журнал вычислений: Массивы в Heap",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["double[] history = @0x99", "history[0] = 10.5"] }],
          heap: [{ obj: "double[5] Array", data: "[10.5, 0.0, 0.0, 0.0, 0.0]" }]
        },
        theory: `
          <h3>Массивы как объекты в куче</h3>
          <p>Массив — это структура фиксированной длины: <code>double[] history = new double[5];</code>.</p>
          <p><strong>Твой квест:</strong> Создай массив <code>double[] history = new double[5];</code>, запиши в ячейку <code>history[0] = 10.5;</code> и выведи <code>history.length</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Индексация всегда с нуля: <code>history[0]</code> — первый элемент.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Где физически создаются массивы в JVM?",
            options: ["В куче (Heap)", "На стеке (Stack)", "В реестре процессора", "В файловой системе"],
            correct: 0,
            explain: "Все массивы в Java являются объектами и размещаются в Heap, а переменная хранит ссылку на них.",
            advice: "Повтори устройство кучи."
          }
        ],
        quiz: {
          question: "Чему равно history.length для new double[5]?",
          options: ["4", "5", "6", "0"],
          correct: 1,
          hint: "Длина созданного массива равна переданному размеру."
        },
        starterCode: `public class Calculator {
    public static void main(String[] args) {
        // Создай double[] history = new double[5];
        // Запиши history[0] = 10.5;
        // Выведи history.length:
        
    }
}`,
        solutionCode: `public class Calculator {
    public static void main(String[] args) {
        double[] history = new double[5];
        history[0] = 10.5;
        System.out.println(history.length);
    }
}`,
        hint: 'double[] history = new double[5]; history[0] = 10.5; System.out.println(history.length);',
        tests: [
          { name: "Выделение массива new double[5]", check: (c) => c.includes("new double[5]"), expected: "double[] history = new double[5];" },
          { name: "Запись в 0-й индекс", check: (c) => /history\[0\]\s*=\s*10\.5;/.test(c), expected: "history[0] = 10.5;" },
          { name: "Вывод длины", check: (c) => c.includes("history.length"), expected: "System.out.println(history.length);" }
        ],
        interactiveFlow: [{ prompt: null, output: "5" }]
      },
      {
        id: 3,
        badge: "ЭТАП 04 / 04",
        title: "Рекурсивный факториал n!",
        memorySnapshot: {
          stack: [
            { method: "factorial(1)", vars: ["return 1"] },
            { method: "factorial(2)", vars: ["return 2 * factorial(1)"] },
            { method: "factorial(3)", vars: ["return 3 * factorial(2)"] }
          ],
          heap: [{ obj: "Call Stack Limit", data: "-Xss1m" }]
        },
        theory: `
          <h3>Рекурсивные методы</h3>
          <p>Функция вызывает саму себя: <code>factorial(n) = n * factorial(n - 1)</code>. Обязателен базовый случай: <code>if (n &lt;= 1) return 1;</code>.</p>
          <p><strong>Твой квест:</strong> Напиши рекурсивный метод <code>public static long factorial(int n)</code> и выведи <code>factorial(5)</code> в методе <code>main</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Без базового случая программа вызовет <code>StackOverflowError</code>.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Что вызывает ошибку java.lang.StackOverflowError?",
            options: [
              "Переполнение кучи",
              "Исчерпание памяти стека вызовов из-за бесконечной или слишком глубокой рекурсии",
              "Деление на 0",
              "Ошибка диска"
            ],
            correct: 1,
            explain: "Каждый рекурсивный вызов занимает отдельный стековый фрейм. При исчерпании стека потока JVM выбрасывает StackOverflowError.",
            advice: "Всегда следи за достижимостью терминального случая в рекурсии."
          }
        ],
        quiz: {
          question: "Чему равен факториал 5!?",
          options: ["25", "60", "120", "720"],
          correct: 2,
          hint: "5 * 4 * 3 * 2 * 1 = 120."
        },
        starterCode: `public class Calculator {
    public static long factorial(int n) {
        // Базовый случай:
        
        // Шаг рекурсии:
        
    }

    public static void main(String[] args) {
        System.out.println(factorial(5));
    }
}`,
        solutionCode: `public class Calculator {
    public static long factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        System.out.println(factorial(5));
    }
}`,
        hint: 'if (n <= 1) return 1; return n * factorial(n - 1);',
        tests: [
          { name: "Сигнатура long factorial(int n)", check: (c) => /public\s+static\s+long\s+factorial\s*\(\s*int\s+n\s*\)/.test(c), expected: "public static long factorial(int n)" },
          { name: "Базовый случай n <= 1", check: (c) => c.includes("n <= 1") || c.includes("n == 1"), expected: "if (n <= 1) return 1;" },
          { name: "Рекурсивный вызов factorial(n - 1)", check: (c) => c.includes("factorial(n - 1)") || c.includes("factorial(n-1)"), expected: "return n * factorial(n - 1);" },
          { name: "Вызов factorial(5) в main", check: (c) => c.includes("factorial(5)"), expected: "System.out.println(factorial(5));" }
        ],
        interactiveFlow: [{ prompt: null, output: "120" }]
      }
    ]
  }
};