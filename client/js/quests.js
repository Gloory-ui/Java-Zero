/**
 * База знаний: Квесты, задания, стресс-тесты и вопросы защиты с выбором вариантов
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
          stack: [
            { method: "main()", vars: ["int a = 10 [4 Bytes]", "double b = 2.5 [8 Bytes]", "double result = 12.5 [8 Bytes]"] }
          ],
          heap: [
            { obj: "String literals pool", data: '"===" [Static String @0x10A]' }
          ]
        },
        theory: `
          <h3>Как компьютер хранит данные?</h3>
          <p>Компьютерная программа — это манипуляция данными в оперативной памяти (RAM). Переменная — это именованная ячейка в памяти (коробка с ярлыком), куда помещается значение.</p>
          <p>Java — язык со <strong>строгой типизацией</strong>. Тип коробки задается один раз при создании:</p>
          <ul>
            <li><strong>int</strong> — целые числа (<code>10</code>, <code>-5</code>, <code>0</code>). Занимает 4 байта памяти.</li>
            <li><strong>double</strong> — дробные числа с плавающей точкой (<code>2.5</code>, <code>-15.8</code>). Занимает 8 байт памяти.</li>
            <li><strong>String</strong> — текст в двойных кавычках (<code>"Привет"</code>). Ссылочный тип.</li>
            <li><strong>boolean</strong> — логический переключатель: <code>true</code> или <code>false</code>.</li>
          </ul>
          <p>Знак <code>=</code> — это <strong>оператор присваивания</strong>. Он читается справа налево: «вычисли то, что справа, и положи результат в ячейку слева»:</p>
          <p><span class="code-inline">double result = a + b;</span></p>
          <p><strong>Твой квест:</strong> Нажми «Начать этап», создай <code>int a = 10;</code>, <code>double b = 2.5;</code>, сохрани сумму в <code>double result = a + b;</code> и выведи через <code>System.out.println(result);</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li><strong>Путаница между = и ==:</strong> Один знак <code>=</code> записывает значение в ячейку, а двойной знак <code>==</code> сравнивает значения.</li>
            <li><strong>Склеивание текста вместо сложения:</strong> Выражение <code>"10" + 5</code> вернет строку <code>"105"</code>, а не число <code>15</code>.</li>
            <li><strong>Точка с запятой:</strong> Каждая завершенная инструкция в Java обязана заканчиваться символом <code>;</code>.</li>
          </ul>
        `,
        // Вопросы для интерактивного экзаменатора
        examTest: [
          {
            q: "В чем фундаментальная разница между типами int и String в оперативной памяти?",
            options: [
              "int хранится в куче (Heap), а String в регистре процессора",
              "int хранит двоичное число прямо в стеке (Stack), а String хранит в стеке ссылку на объект в куче (Heap)",
              "Никакой разницы нет, это синонимы",
              "String занимает 4 байта, а int занимает 8 байт"
            ],
            correct: 1,
            explain: "Примитивные типы (int, double) хранят значение прямо на стеке. Ссылочные объекты (String) живут в куче (Heap), а стек хранит только 64-битный указатель на этот адрес.",
            advice: "Повтори разницу между стеком и кучей во вкладке «Память RAM»."
          },
          {
            q: "Что происходит в строке `double result = a + b`, если a — int (10), а b — double (2.5)?",
            options: [
              "Ошибка несовместимости типов при компиляции",
              "Значение b округляется до 2, и результат равен 12",
              "Автоматическое расширение: int временно повышается до double (10.0), результат 12.5",
              "Программа падает с ArithmeticException"
            ],
            correct: 2,
            explain: "В Java при операции между целым и дробным числом меньший тип неявно расширяется до большего (widening primitive conversion).",
            advice: "Изучи раздел неявного приведения примитивных типов."
          }
        ],
        quiz: {
          question: "Какой тип переменной нужен для хранения дробного числа 3.14?",
          options: ["int", "double", "boolean", "char"],
          correct: 1,
          hint: "Числа с плавающей точкой в Java объявляются типом double."
        },
        starterCode: `public class Basics {
    public static void main(String[] args) {
        // 1. Создай переменную int a = 10;
        
        // 2. Создай переменную double b = 2.5;
        
        // 3. Создай переменную double result = a + b;
        
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
        hint: 'int a = 10; double b = 2.5; double result = a + b; System.out.println(result); (Или набери sout и нажми Tab!)',
        tests: [
          { name: "Класс Basics с точкой входа main", check: (c) => c.includes("class Basics") && c.includes("main"), expected: "public class Basics { public static void main(String[] args) }" },
          { name: "Объявление int a = 10", check: (c) => /int\s+a\s*=\s*10\s*;/.test(c), expected: "int a = 10;" },
          { name: "Объявление double b = 2.5", check: (c) => /double\s+b\s*=\s*2\.5\s*;/.test(c), expected: "double b = 2.5;" },
          { name: "Вычисление double result = a + b", check: (c) => /double\s+result\s*=\s*a\s*\+\s*b\s*;/.test(c), expected: "double result = a + b;" },
          { name: "Вывод System.out.println(result)", check: (c) => /System\.out\.println\s*\(\s*result\s*\)\s*;/.test(c), expected: "System.out.println(result);" }
        ],
        interactiveFlow: [
          { prompt: "Введите любое целое число a (int):", key: "a" },
          { prompt: "Введите любое дробное число b (double):", key: "b", onDone: (d) => {
            const a = parseInt(d.a, 10);
            const b = parseFloat(d.b);
            return `[RAM] Ячейка 'a' = ${a}, 'b' = ${b}, 'result' = ${a + b}\nВывод в терминал: ${a + b}`;
          }}
        ]
      },

      {
        id: 1,
        badge: "ЭТАП 02 / 02",
        title: "Арифметика и ловушка деления",
        memorySnapshot: {
          stack: [
            { method: "main()", vars: ["double div = 3.5 [8 Bytes (IEEE 754)]"] }
          ],
          heap: [
            { obj: "String Pool", data: '"3.5" [Buffered output string]' }
          ]
        },
        theory: `
          <h3>Главная ловушка деления в Java</h3>
          <p>В Java действует строгое правило: <strong>операция над двумя целыми числами всегда возвращает целое число</strong>.</p>
          <pre class="code-inline" style="display:block; padding:10px; margin-bottom:12px;">
int x = 7 / 2;     // Равно 3! Дробная часть .5 отсекается.
double y = 7 / 2;   // Равно 3.0! Сначала деление целых (3), затем приведение к double.
double z = 7.0 / 2; // Равно 3.5! Одно число дробное, деление точное.
          </pre>
          <p>Чтобы получить математически точный результат, хотя бы один операнд обязан иметь тип <code>double</code>.</p>
          <p><strong>Твой квест:</strong> Создай переменную <code>double div = 7.0 / 2;</code> и выведи ее в консоль: <code>System.out.println(div);</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Написать <code>double div = 7 / 2;</code> — Java сначала поделит целые числа, получит <code>3</code>, и запишет <code>3.0</code>, потеряв дробную часть!</li>
          </ul>
        `,
        examTest: [
          {
            q: "Чему равно значение переменной double result = 5 / 2; в Java?",
            options: ["2.5", "2.0", "3.0", "Ошибка компиляции"],
            correct: 1,
            explain: "5 и 2 имеют тип int. 5 / 2 дает целочисленный результат 2. Затем при присваивании в double двойка расширяется до 2.0. Дробная часть утеряна!",
            advice: "Всегда помни: чтобы деление было точным, пиши хотя бы одно число с точкой (5.0 / 2)."
          },
          {
            q: "Как правильно заставить Java поделить две переменные int a и int b с сохранением дробной части?",
            options: [
              "int result = a / b;",
              "double result = (double) a / b;",
              "double result = (double) (a / b);",
              "double result = a / (int) b;"
            ],
            correct: 1,
            explain: "Приведение `(double) a / b` сначала превращает 'a' в double, после чего выполняется вещественное деление. Вариант `(double)(a/b)` неверен, так как деление выполнится в целых числах до приведения.",
            advice: "Обрати внимание на приоритет операторов при явном приведении (casting)."
          }
        ],
        quiz: {
          question: "Чему равно значение переменной double d = 5 / 2; в Java?",
          options: ["2.5", "2.0", "3.0", "Ошибка компиляции"],
          correct: 1,
          hint: "Сначала 5/2 дает int 2, затем преобразуется в double 2.0."
        },
        starterCode: `public class Basics {
    public static void main(String[] args) {
        // Создай переменную double div с дробным делением 7.0 на 2:
        
        // Выведи div в консоль:
        
    }
}`,
        solutionCode: `public class Basics {
    public static void main(String[] args) {
        double div = 7.0 / 2;
        System.out.println(div);
    }
}`,
        hint: 'double div = 7.0 / 2; System.out.println(div);',
        tests: [
          { name: "Класс Basics с методом main", check: (c) => c.includes("class Basics") && c.includes("main"), expected: "public class Basics { public static void main(String[] args) }" },
          { name: "Вещественное деление 7.0 / 2", check: (c) => c.includes("7.0 / 2") || c.includes("7.0/2") || c.includes("(double) 7 / 2") || c.includes("7 / 2.0"), expected: "double div = 7.0 / 2;" },
          { name: "Вывод переменной div в консоль", check: (c) => /System\.out\.println\s*\(\s*div\s*\)\s*;/.test(c), expected: "System.out.println(div);" }
        ],
        interactiveFlow: [
          { prompt: "Тест деления. Введите делимое с точкой (например 9.0):", key: "a" },
          { prompt: "Введите делитель (например 2):", key: "b", onDone: (d) => `Результат вещественного деления: ${parseFloat(d.a) / parseFloat(d.b)}` }
        ]
      }
    ]
  },

  calc: {
    id: "calc",
    num: "01",
    title: "Калькулятор",
    subTitle: "Массивы, switch, рекурсия",
    fileName: "Calculator.java",
    stages: [
      {
        id: 0,
        badge: "ЭТАП 01 / 08",
        title: "Базовый каркас и точка входа main",
        memorySnapshot: {
          stack: [{ method: "main(String[] args)", vars: ["args: ref @0x00A [Array String[0]]"] }],
          heap: [{ obj: "String[] args", data: "[] (length: 0)" }]
        },
        theory: `
          <h3>Архитектура программы</h3>
          <p>В Java любой код упаковывается в <strong>класс</strong>. Имя файла <code>Calculator.java</code> обязано точно совпадать с именем публичного класса.</p>
          <p>Ключевая точка старта любой программы:</p>
          <p><span class="code-inline">public static void main(String[] args)</span></p>
          <ul>
            <li><strong>public</strong> — доступен отовсюду.</li>
            <li><strong>static</strong> — вызывается напрямую без создания экземпляра класса.</li>
            <li><strong>void</strong> — метод не возвращает значение.</li>
            <li><strong>System.out.println(...)</strong> — печатает текст и переводит строку.</li>
          </ul>
          <p><strong>Твой квест:</strong> Собери класс <code>Calculator</code> с методом <code>main</code>, выводящим <code>"=== КАЛЬКУЛЯТОР ЗАПУЩЕН ==="</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li><strong>Регистр букв:</strong> <code>String</code> и <code>System</code> — с большой буквы, <code>main</code> — с маленькой!</li>
            <li><strong>Точка с запятой:</strong> В конце строки с командой всегда ставится <code>;</code>.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Почему класс называется Calculator, и что произойдет при несовпадении имени файла?",
            options: [
              "Программа скомпилируется, но будет работать медленно",
              "Ошибка компилятора: public class must be defined in a file named Calculator.java",
              "JVM автоматически переименует файл на диске",
              "Ничего не произойдет, Java все равно"
            ],
            correct: 1,
            explain: "Публичный класс в Java обязан строго соответствовать имени .java файла, иначе компилятор javac прервет сборку.",
            advice: "Всегда следи за соответствием имени файла и имени класса."
          }
        ],
        quiz: {
          question: "Какая строка является правильной точкой старта в Java?",
          options: ["function main()", "public static void main(String[] args)", "void start(args[])", "public void run(String args)"],
          correct: 1,
          hint: "Нужен public static void main(String[] args)."
        },
        starterCode: `public class Calculator {
    public static void main(String[] args) {
        // Выведи в терминал: "=== КАЛЬКУЛЯТОР ЗАПУЩЕН ==="
        
    }
}`,
        solutionCode: `public class Calculator {
    public static void main(String[] args) {
        System.out.println("=== КАЛЬКУЛЯТОР ЗАПУЩЕН ===");
    }
}`,
        hint: 'System.out.println("=== КАЛЬКУЛЯТОР ЗАПУЩЕН ==="); (Шорткат sout + Tab)',
        tests: [
          { name: "Наличие класса Calculator", check: (c) => c.includes("class Calculator"), expected: "public class Calculator" },
          { name: "Сигнатура main(String[] args)", check: (c) => /public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*args\s*\)/.test(c), expected: "public static void main(String[] args)" },
          { name: "Вывод точного заголовка", check: (c) => c.includes("System.out.println") && c.includes("=== КАЛЬКУЛЯТОР ЗАПУЩЕН ==="), expected: 'System.out.println("=== КАЛЬКУЛЯТОР ЗАПУЩЕН ===");' }
        ],
        interactiveFlow: [{ prompt: null, output: "=== КАЛЬКУЛЯТОР ЗАПУЩЕН ===" }]
      }
    ]
  }
};