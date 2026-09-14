/**
 * База знаний: Квесты 00 и 01 (Все 8 этапов калькулятора + тесты + симулятор защиты)
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
            explain: "Примитивные типы (int, double) хранятся непосредственно в стековом фрейме. Ссылочные типы (String) хранятся в куче, а на стеке лежит ссылка (указатель).",
            advice: "Повтори разницу между стеком и кучей во вкладке «Память RAM»."
          },
          {
            q: "Что произойдет при вычислении double res = a + b, если a — int, а b — double?",
            options: [
              "Ошибка несовместимости типов при компиляции",
              "Значение b округлится до целого числа",
              "Неявное расширение (Widening): int неявно преобразуется в double перед сложением",
              "Программа выбросит ArithmeticException"
            ],
            correct: 2,
            explain: "При математической операции между целым и вещественным типом целый операнд неявно расширяется до double.",
            advice: "Изучи правила неявного приведения типов (type casting)."
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
          { name: "Класс Basics с точкой входа main", check: (c) => c.includes("class Basics") && c.includes("main"), expected: "public class Basics { public static void main(String[] args) }" },
          { name: "Объявление int a = 10", check: (c) => /int\s+a\s*=\s*10\s*;/.test(c), expected: "int a = 10;" },
          { name: "Объявление double b = 2.5", check: (c) => /double\s+b\s*=\s*2\.5\s*;/.test(c), expected: "double b = 2.5;" },
          { name: "Сложение a + b в result", check: (c) => /double\s+result\s*=\s*a\s*\+\s*b\s*;/.test(c), expected: "double result = a + b;" },
          { name: "Вывод System.out.println(result)", check: (c) => /System\.out\.println\s*\(\s*result\s*\)\s*;/.test(c), expected: "System.out.println(result);" }
        ],
        interactiveFlow: [
          { prompt: "Введите целое число a:", key: "a" },
          { prompt: "Введите вещественное число b:", key: "b", onDone: (d) => `Результат: ${parseInt(d.a, 10) + parseFloat(d.b)}` }
        ]
      },

      {
        id: 1,
        badge: "ЭТАП 02 / 02",
        title: "Арифметика и ловушка деления",
        memorySnapshot: {
          stack: [{ method: "main()", vars: ["double div = 3.5 [8 Bytes]"] }],
          heap: [{ obj: "String Pool", data: '"3.5"' }]
        },
        theory: `
          <h3>Ловушка деления целых чисел</h3>
          <p>Операция деления над двумя целыми числами (<code>7 / 2</code>) всегда возвращает целое число <code>3</code> (дробная часть отсекается).</p>
          <p>Чтобы получить <code>3.5</code>, хотя бы один операнд обязан иметь точку: <code>7.0 / 2</code>.</p>
          <p><strong>Твой квест:</strong> Создай переменную <code>double div = 7.0 / 2;</code> и выведи ее через <code>System.out.println(div);</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li><code>double div = 7 / 2;</code> запишет <code>3.0</code>, так как деление выполнится в целых числах до присвоения.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Чему равно значение переменной double d = 5 / 2; в Java?",
            options: ["2.5", "2.0", "3.0", "Ошибка компиляции"],
            correct: 1,
            explain: "5 / 2 дает целое число 2. Затем при неявном приведении к double оно становится 2.0.",
            advice: "Всегда указывай дробную точку хотя бы у одного числа (5.0 / 2)."
          }
        ],
        quiz: {
          question: "Чему равно 7 / 2 в Java?",
          options: ["3.5", "3", "4", "Ошибка"],
          correct: 1,
          hint: "Деление двух целых операндов отбрасывает дробную часть."
        },
        starterCode: `public class Basics {
    public static void main(String[] args) {
        // Создай double div = 7.0 / 2;
        
        // Выведи div в консоль
        
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
          { name: "Класс Basics с main", check: (c) => c.includes("class Basics") && c.includes("main"), expected: "public class Basics { public static void main(String[] args) }" },
          { name: "Деление 7.0 / 2", check: (c) => c.includes("7.0 / 2") || c.includes("7.0/2") || c.includes("(double) 7 / 2"), expected: "double div = 7.0 / 2;" },
          { name: "Вывод div", check: (c) => /System\.out\.println\s*\(\s*div\s*\)\s*;/.test(c), expected: "System.out.println(div);" }
        ],
        interactiveFlow: [
          { prompt: "Введите делимое (например, 7.0):", key: "a" },
          { prompt: "Введите делитель (например, 2):", key: "b", onDone: (d) => `Результат: ${parseFloat(d.a) / parseFloat(d.b)}` }
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
        title: "Базовый каркас и заставка",
        memorySnapshot: {
          stack: [{ method: "main(String[] args)", vars: ["args = @0x01 [len: 0]"] }],
          heap: [{ obj: "String Pool", data: '"=== КАЛЬКУЛЯТОР ЗАПУЩЕН ==="' }]
        },
        theory: `
          <h3>Точка входа в приложение</h3>
          <p>Любая консольная программа на Java начинается с метода <code>public static void main(String[] args)</code> внутри публичного класса.</p>
          <ul>
            <li><strong>public</strong> — доступен виртуальной машине JVM отовсюду.</li>
            <li><strong>static</strong> — вызывается без создания экземпляра класса через <code>new</code>.</li>
            <li><strong>void</strong> — ничего не возвращает в вызывающий процесс.</li>
          </ul>
          <p><strong>Твой квест:</strong> Напиши класс <code>Calculator</code> с методом <code>main</code>, выводящим <code>"=== КАЛЬКУЛЯТОР ЗАПУЩЕН ==="</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Имя файла <code>Calculator.java</code> обязано в точности совпадать с именем публичного класса <code>Calculator</code>.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Почему метод main объявлен как static?",
            options: [
              "Чтобы метод работал быстрее обычных методов",
              "Чтобы JVM могла вызвать его при старте программы, не создавая экземпляр объекта через new Calculator()",
              "Потому что в классе Calculator запрещено использовать переменные",
              "Это требование устарело и больше не обязательно в Java 21"
            ],
            correct: 1,
            explain: "Ключевое слово static позволяет JVM запустить программу до создания каких-либо объектов в куче.",
            advice: "Повтори разницу между статическими методами класса и методами экземпляра."
          }
        ],
        quiz: {
          question: "Что произойдет, если стереть слово static у метода main?",
          options: ["Программа скомпилируется, но JVM выдаст ошибку отсутствия главного метода", "Ошибка компилятора javac", "Программа отработает без изменений", "Метод превратится в конструктор"],
          correct: 0,
          hint: "Javac пропустит такой метод, но JVM не сможет использовать его как точку входа."
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
          { name: "Метод public static void main", check: (c) => /public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*args\s*\)/.test(c), expected: "public static void main(String[] args)" },
          { name: "Точный вывод заставки", check: (c) => c.includes("=== КАЛЬКУЛЯТОР ЗАПУЩЕН ==="), expected: 'System.out.println("=== КАЛЬКУЛЯТОР ЗАПУЩЕН ===");' }
        ],
        interactiveFlow: [{ prompt: null, output: "=== КАЛЬКУЛЯТОР ЗАПУЩЕН ===" }]
      },

      {
        id: 1,
        badge: "ЭТАП 02 / 08",
        title: "Потоковый ввод через Scanner",
        memorySnapshot: {
          stack: [
            { method: "main()", vars: ["Scanner sc = @0x4B [System.in]", "double num1 = 15.0", "double num2 = 3.0"] }
          ],
          heap: [{ obj: "Scanner Object", data: "Buffer: InputStreamReader(System.in)" }]
        },
        theory: `
          <h3>Чтение данных от пользователя</h3>
          <p>Для считывания данных из терминала используется класс <code>java.util.Scanner</code>:</p>
          <pre class="code-inline" style="display:block; padding:8px; margin:8px 0;">
import java.util.Scanner;
...
Scanner sc = new Scanner(System.in);
double num1 = sc.nextDouble();
double num2 = sc.nextDouble();
          </pre>
          <p><strong>Твой квест:</strong> Подключи <code>import java.util.Scanner;</code>, инициализируй сканер, прочитай два числа <code>num1</code> и <code>num2</code> типа <code>double</code> и выведи их сумму.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Забыть импорт <code>import java.util.Scanner;</code> в начале файла приводит к ошибке <code>cannot find symbol</code>.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Что такое System.in в параметре new Scanner(System.in)?",
            options: [
              "Специальный строковый буфер в куче JVM",
              "Стандартный байтовый поток ввода (InputStream), подключенный к клавиатуре/консоли",
              "Файл конфигурации операционной системы",
              "Драйвер клавиатуры операционной системы"
            ],
            correct: 1,
            explain: "System.in — это статический объект класса InputStream, представляющий стандартный поток ввода операционной системы.",
            advice: "Повтори устройство потоков ввода-вывода (I/O Streams)."
          },
          {
            q: "Какая коварная проблема возникает, если после sc.nextDouble() сразу вызвать sc.nextLine()?",
            options: [
              "Программа падает с OutOfMemoryError",
              "nextLine() считывает оставшийся в буфере символ перевода строки '\\n' и возвращает пустую строку",
              "Scanner автоматически очищает буфер",
              "Компилятор запрещает вызывать эти методы подряд"
            ],
            correct: 1,
            explain: "Метод nextDouble() считывает только числовые символы, оставляя невидимый символ нажатия клавиши Enter ('\\n') в буфере.",
            advice: "Помни: после считывания чисел всегда делай пустой sc.nextLine() для очистки буфера."
          }
        ],
        quiz: {
          question: "Какой метод Scanner считывает дробное число?",
          options: ["sc.readDouble()", "sc.nextDouble()", "sc.getDouble()", "sc.nextFloat64()"],
          correct: 1,
          hint: "Стандартный метод Scanner называется nextDouble()."
        },
        starterCode: `import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // 1. Считай double num1
        
        // 2. Считай double num2
        
        // 3. Выведи их сумму (num1 + num2)
        
    }
}`,
        solutionCode: `import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double num1 = sc.nextDouble();
        double num2 = sc.nextDouble();
        System.out.println(num1 + num2);
    }
}`,
        hint: 'double num1 = sc.nextDouble(); double num2 = sc.nextDouble(); System.out.println(num1 + num2);',
        tests: [
          { name: "Импорт java.util.Scanner", check: (c) => c.includes("import java.util.Scanner;"), expected: "import java.util.Scanner;" },
          { name: "Инициализация new Scanner(System.in)", check: (c) => c.includes("new Scanner(System.in)"), expected: "Scanner sc = new Scanner(System.in);" },
          { name: "Считывание num1 и num2", check: (c) => c.includes("sc.nextDouble()"), expected: "double num1 = sc.nextDouble(); double num2 = sc.nextDouble();" },
          { name: "Вывод суммы чисел", check: (c) => c.includes("System.out.println") && (c.includes("num1 + num2") || c.includes("+")), expected: "System.out.println(num1 + num2);" }
        ],
        interactiveFlow: [
          { prompt: "Введите первое число (num1):", key: "n1" },
          { prompt: "Введите второе число (num2):", key: "n2", onDone: (d) => `Вывод суммы: ${parseFloat(d.n1) + parseFloat(d.n2)}` }
        ]
      },

      {
        id: 2,
        badge: "ЭТАП 03 / 08",
        title: "Конструкция switch и операции",
        memorySnapshot: {
          stack: [
            { method: "main()", vars: ["char op = '+'", "double res = 18.0"] }
          ],
          heap: [{ obj: "Jump Table", data: "Switch binary offsets" }]
        },
        theory: `
          <h3>Ветвление логики через switch</h3>
          <p>Вместо громоздких цепочек <code>if-else</code> для выбора арифметической операции используют <code>switch</code>:</p>
          <pre class="code-inline" style="display:block; padding:8px; margin:8px 0;">
switch (op) {
    case '+': res = num1 + num2; break;
    case '-': res = num1 - num2; break;
    case '*': res = num1 * num2; break;
    case '/': res = num1 / num2; break;
    default: System.out.println("Ошибка!");
}
          </pre>
          <p><strong>Твой квест:</strong> Добавь считывание символа операции <code>char op = sc.next().charAt(0);</code> и вычисление результата через <code>switch</code> для +, -, *, /.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li><strong>Забытый break:</strong> если не написать <code>break</code>, выполнение провалится в следующий case (эффект <em>fall-through</em>).</li>
          </ul>
        `,
        examTest: [
          {
            q: "Что произойдет в switch(op), если забыть оператор break после case '+'?",
            options: [
              "Ошибка компиляции",
              "Управление провалится в следующий блок case '-' и выполнит его код (fall-through)",
              "Программа сразу завершит метод main",
              "JVM вернет исключение NullPointerException"
            ],
            correct: 1,
            explain: "Без break управление автоматически переходит к исполнению инструкций следующего case вне зависимости от условия.",
            advice: "Всегда завершай каждую ветку case оператором break."
          }
        ],
        quiz: {
          question: "Что делает блок default в конструкции switch?",
          options: ["Вызывается первым", "Выполняется, если ни один case не подошел", "Служит для завершения программы", "Очищает переменные в памяти"],
          correct: 1,
          hint: "default — это аналог блока else."
        },
        starterCode: `import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double num1 = sc.nextDouble();
        char op = sc.next().charAt(0);
        double num2 = sc.nextDouble();
        double res = 0;

        // Реализуй switch (op) с ветками '+', '-', '*', '/' и выводом res:
        
    }
}`,
        solutionCode: `import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double num1 = sc.nextDouble();
        char op = sc.next().charAt(0);
        double num2 = sc.nextDouble();
        double res = 0;

        switch (op) {
            case '+': res = num1 + num2; break;
            case '-': res = num1 - num2; break;
            case '*': res = num1 * num2; break;
            case '/': res = num1 / num2; break;
        }
        System.out.println(res);
    }
}`,
        hint: "switch(op) { case '+': res = num1 + num2; break; ... } System.out.println(res);",
        tests: [
          { name: "Наличие конструкции switch", check: (c) => c.includes("switch") && c.includes("case '+'"), expected: "switch (op) { case '+': ... break; }" },
          { name: "Наличие всех 4 операций", check: (c) => c.includes("case '-'") && c.includes("case '*'") && c.includes("case '/'"), expected: "+, -, *, /" },
          { name: "Вывод переменной res", check: (c) => /System\.out\.println\s*\(\s*res\s*\)\s*;/.test(c), expected: "System.out.println(res);" }
        ],
        interactiveFlow: [
          { prompt: "Введите num1:", key: "n1" },
          { prompt: "Введите знак (+, -, *, /):", key: "op" },
          { prompt: "Введите num2:", key: "n2", onDone: (d) => {
            const a = parseFloat(d.n1), b = parseFloat(d.n2);
            let r = 0;
            if (d.op === '+') r = a + b;
            else if (d.op === '-') r = a - b;
            else if (d.op === '*') r = a * b;
            else if (d.op === '/') r = a / b;
            return `Ответ: ${r}`;
          }}
        ]
      },

      {
        id: 3,
        badge: "ЭТАП 04 / 08",
        title: "Защита от нуля и стандарт IEEE 754",
        memorySnapshot: {
          stack: [
            { method: "main()", vars: ["num2 == 0 -> Branch: Error"] }
          ],
          heap: [{ obj: "Console Output", data: '"Ошибка: деление на ноль!"' }]
        },
        theory: `
          <h3>Особенность деления вещественных чисел</h3>
          <p>В Java деление целых чисел <code>5 / 0</code> приводит к аварийному падению <code>ArithmeticException: / by zero</code>.</p>
          <p>Но при работе с <code>double</code> деление <code>5.0 / 0.0</code> не выбрасывает ошибку, а возвращает специальную константу <strong>Infinity</strong> (бесконечность) по стандарту IEEE 754!</p>
          <p>В инженерных программах это недопустимо. Перед операцией деления обязательна проверка:</p>
          <pre class="code-inline" style="display:block; padding:8px; margin:8px 0;">
case '/':
    if (num2 == 0) {
        System.out.println("Ошибка: деление на ноль!");
    } else {
        res = num1 / num2;
        System.out.println(res);
    }
    break;
          </pre>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Полагаться на то, что программа сама упадет в <code>try-catch</code> при делении <code>double</code> на 0: этого не произойдет, и в вычисления уйдет <code>Infinity</code> или <code>NaN</code>.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Почему операция 10.0 / 0.0 в Java НЕ выбрасывает ArithmeticException?",
            options: [
              "Это баг ранних версий JVM, сохраненный для обратной совместимости",
              "Тип double следует стандарту IEEE 754, где деление на 0 дает математическое значение Infinity",
              "JVM автоматически преобразует 0 в 0.000001",
              "Потому что исключения выбрасывают только методы Scanner"
            ],
            correct: 1,
            explain: "Стандарт IEEE 754 определяет поведение чисел с плавающей точкой: деление положительного числа на 0 дает Positive Infinity, а 0.0 / 0.0 дает NaN (Not a Number).",
            advice: "Всегда делай явную проверку (if num2 == 0) при работе с double."
          }
        ],
        quiz: {
          question: "Что вернет выражение (0.0 / 0.0) в Java?",
          options: ["0.0", "ArithmeticException", "NaN (Not a Number)", "Infinity"],
          correct: 2,
          hint: "Неопределенность 0/0 в стандарте IEEE 754 кодируется как NaN."
        },
        starterCode: `import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double num1 = sc.nextDouble();
        char op = sc.next().charAt(0);
        double num2 = sc.nextDouble();

        if (op == '/') {
            // Реализуй проверку: если num2 == 0, выведи "Ошибка: деление на ноль!", иначе выведи num1 / num2
            
        }
    }
}`,
        solutionCode: `import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double num1 = sc.nextDouble();
        char op = sc.next().charAt(0);
        double num2 = sc.nextDouble();

        if (op == '/') {
            if (num2 == 0) {
                System.out.println("Ошибка: деление на ноль!");
            } else {
                System.out.println(num1 / num2);
            }
        }
    }
}`,
        hint: 'if (num2 == 0) System.out.println("Ошибка: деление на ноль!"); else System.out.println(num1 / num2);',
        tests: [
          { name: "Проверка num2 == 0", check: (c) => c.includes("num2 == 0") || c.includes("0 == num2"), expected: "if (num2 == 0)" },
          { name: "Вывод точного текста ошибки", check: (c) => c.includes("Ошибка: деление на ноль!"), expected: 'System.out.println("Ошибка: деление на ноль!");' }
        ],
        interactiveFlow: [
          { prompt: "Введите делимое:", key: "n1" },
          { prompt: "Введите делитель (попробуйте 0):", key: "n2", onDone: (d) => {
            return parseFloat(d.n2) === 0 ? "Ошибка: деление на ноль!" : `Результат: ${parseFloat(d.n1) / parseFloat(d.n2)}`;
          }}
        ]
      },

      {
        id: 4,
        badge: "ЭТАП 05 / 08",
        title: "Непрерывный цикл работы приложения",
        memorySnapshot: {
          stack: [
            { method: "main()", vars: ["boolean running = true", "String cmd = 'exit'"] }
          ],
          heap: [{ obj: "String Pool", data: '"exit" (Interned String)' }]
        },
        theory: `
          <h3>Удержание программы в активном состоянии</h3>
          <p>Настоящая консольная программа не должна завершаться после одного вычисления. Для этого логика оборачивается в цикл <code>while (true)</code>, а для выхода анализируется ввод пользователя:</p>
          <pre class="code-inline" style="display:block; padding:8px; margin:8px 0;">
while (true) {
    String cmd = sc.next();
    if (cmd.equals("exit")) {
        System.out.println("Выход из программы.");
        break;
    }
}
          </pre>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li><strong>Сравнение через == :</strong> Строки в Java сравниваются <strong>только методом .equals()</strong>. Знак <code>==</code> сравнивает адреса в памяти, а не текст.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Почему в Java для проверки равенства строк нельзя использовать cmd == 'exit'?",
            options: [
              "Это замедляет сборщик мусора GC",
              "Оператор == сравнивает адреса ссылок в памяти (Heap), а метод .equals() сравнивает посимвольное содержимое",
              "Оператор == работает только с числами типа int",
              "Потому что строки в Java являются изменяемыми объектами"
            ],
            correct: 1,
            explain: "== проверяет ссылочную идентичность (указывают ли переменные на одну ячейку памяти). Две разные строки с одинаковым текстом вернут false при проверке через ==.",
            advice: "Запомни железное правило: строки всегда сравниваются через .equals()."
          }
        ],
        quiz: {
          question: "Какой метод корректно проверяет равенство двух строк?",
          options: ["str1 == str2", "str1.equals(str2)", "str1.isEqual(str2)", "str1 === str2"],
          correct: 1,
          hint: "В Java используется метод .equals()."
        },
        starterCode: `import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Напиши цикл while(true), который считывает строку String cmd = sc.next();
        // Если cmd.equals("exit") — печатает "Выход из программы." и делает break.
        
    }
}`,
        solutionCode: `import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        while (true) {
            String cmd = sc.next();
            if (cmd.equals("exit")) {
                System.out.println("Выход из программы.");
                break;
            }
        }
    }
}`,
        hint: 'while (true) { String cmd = sc.next(); if (cmd.equals("exit")) { System.out.println("Выход из программы."); break; } }',
        tests: [
          { name: "Наличие цикла while", check: (c) => c.includes("while"), expected: "while (true)" },
          { name: "Сравнение через .equals(\"exit\")", check: (c) => c.includes('.equals("exit")') || c.includes(".equals('exit')"), expected: 'cmd.equals("exit")' },
          { name: "Вывод сообщения и break", check: (c) => c.includes("Выход из программы.") && c.includes("break;"), expected: 'System.out.println("Выход из программы."); break;' }
        ],
        interactiveFlow: [
          { prompt: "Введите команду (напишите 'calc' или 'exit'):", key: "cmd", onDone: (d) => {
            return d.cmd === 'exit' ? "Выход из программы." : "Продолжаем работу...";
          }}
        ]
      },

      {
        id: 5,
        badge: "ЭТАП 06 / 08",
        title: "Журнал вычислений: Массивы в Heap",
        memorySnapshot: {
          stack: [
            { method: "main()", vars: ["double[] history = ref @0x99", "int count = 2"] }
          ],
          heap: [
            { obj: "double[5] Array @0x99", data: "[ 12.5, 4.0, 0.0, 0.0, 0.0 ]" }
          ]
        },
        theory: `
          <h3>Размещение массивов в куче (Heap)</h3>
          <p>Массив в Java — это полноценный объект фиксированной длины, живущий в куче (Heap). На стеке сохраняется лишь ссылка на него:</p>
          <pre class="code-inline" style="display:block; padding:8px; margin:8px 0;">
double[] history = new double[5]; // выделяет непрерывный блок памяти в Heap
history[0] = 12.5;
          </pre>
          <p><strong>Твой квест:</strong> Создай массив <code>double[] history = new double[5];</code>, запиши в ячейку <code>history[0] = 10.5;</code> и выведи длину массива через <code>System.out.println(history.length);</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Индексация массивов начинается с <code>0</code>. Попытка обратиться к <code>history[5]</code> выбросит <code>ArrayIndexOutOfBoundsException</code>.</li>
            <li>Массивы в Java фиксированы: изменить длину созданного массива невозможно.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Где в памяти JVM создается массив new double[5] и чем заполнены его ячейки по умолчанию?",
            options: [
              "На стеке вызовов; ячейки содержат случайный мусор из RAM",
              "В куче (Heap); числовые ячейки инициализируются нулями (0.0)",
              "В пуле констант; ячейки равны null",
              "В регистрах процессора; ячейки равны 1.0"
            ],
            correct: 1,
            explain: "Все массивы создаются в Heap. При создании JVM автоматически обнуляет память: числа получают 0/0.0, boolean получает false, ссылки — null.",
            advice: "Изучи поведение значений по умолчанию для ссылочных и примитивных типов."
          }
        ],
        quiz: {
          question: "Какой индекс имеет первый элемент любого массива в Java?",
          options: ["1", "0", "-1", "Зависит от настроек компилятора"],
          correct: 1,
          hint: "Индексация в Java строго с нуля."
        },
        starterCode: `public class Calculator {
    public static void main(String[] args) {
        // 1. Создай массив double[] history на 5 ячеек
        
        // 2. Запиши в первую ячейку значение 10.5
        
        // 3. Выведи длину массива (history.length)
        
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
          { name: "Вывод history.length", check: (c) => c.includes("history.length"), expected: "System.out.println(history.length);" }
        ],
        interactiveFlow: [
          { prompt: "Введите значение для сохранения в ячейку истории [0]:", key: "val", onDone: (d) => `[Heap @0x99] history[0] = ${parseFloat(d.val)} записано успешно!` }
        ]
      },

      {
        id: 6,
        badge: "ЭТАП 07 / 08",
        title: "Декомпозиция: Статические методы",
        memorySnapshot: {
          stack: [
            { method: "calculate(a, b, op)", vars: ["a = 8.0", "b = 2.0", "op = '*'"] },
            { method: "main()", vars: ["double answer = 16.0"] }
          ],
          heap: [{ obj: "Class Metadata", data: "Calculator.class Bytecode in Metaspace" }]
        },
        theory: `
          <h3>Выделение логики в отдельные функции</h3>
          <p>Код метода <code>main</code> должен оставаться лаконичным. Математику выносят в чистую статическую функцию:</p>
          <pre class="code-inline" style="display:block; padding:8px; margin:8px 0;">
public static double add(double a, double b) {
    return a + b;
}
          </pre>
          <p>При вызове метода создается отдельный <strong>стековый фрейм (Stack Frame)</strong>, который уничтожается при срабатывании <code>return</code>.</p>
          <p><strong>Твой квест:</strong> Объяви метод <code>public static double add(double a, double b)</code>, возвращающий сумму, и вызови его в <code>main</code> с аргументами 5 и 3.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Попытка вызвать нестатический метод из статического <code>main</code> без создания объекта приводит к ошибке <code>non-static method cannot be referenced from a static context</code>.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Что физически происходит в памяти JVM, когда метод выполняет оператор return?",
            options: [
              "Сборщик мусора GC немедленно очищает всю кучу",
              "Стековый фрейм метода снимается со стека (pop), освобождая память локальных переменных",
              "Код метода заново компилируется JIT-компилятором",
              "Значение сохраняется в постоянный пул памяти Metaspace"
            ],
            correct: 1,
            explain: "Вызов метода помещает фрейм на стек вызовов (push), а завершение через return мгновенно сбрасывает этот фрейм со стека (pop).",
            advice: "Повтори устройство Call Stack и жизненный цикл стековых фреймов."
          }
        ],
        quiz: {
          question: "Какое ключевое слово указывает, что метод не возвращает значение?",
          options: ["null", "empty", "void", "static"],
          correct: 2,
          hint: "Тип void сообщает об отсутствии возвращаемого значения."
        },
        starterCode: `public class Calculator {
    // 1. Объяви метод: public static double add(double a, double b)
    
    public static void main(String[] args) {
        // 2. Вызови add(5, 3) и выведи результат через System.out.println
        
    }
}`,
        solutionCode: `public class Calculator {
    public static double add(double a, double b) {
        return a + b;
    }

    public static void main(String[] args) {
        System.out.println(add(5, 3));
    }
}`,
        hint: 'public static double add(double a, double b) { return a + b; } в main: System.out.println(add(5, 3));',
        tests: [
          { name: "Сигнатура метода public static double add", check: (c) => /public\s+static\s+double\s+add\s*\(\s*double\s+a\s*,\s*double\s+b\s*\)/.test(c), expected: "public static double add(double a, double b)" },
          { name: "Оператор return a + b", check: (c) => c.includes("return a + b;") || c.includes("return a+b;"), expected: "return a + b;" },
          { name: "Вызов add(5, 3) в main", check: (c) => c.includes("add(5, 3)") || c.includes("add(5.0, 3.0)"), expected: "add(5, 3)" }
        ],
        interactiveFlow: [
          { prompt: "Число A:", key: "a" },
          { prompt: "Число B:", key: "b", onDone: (d) => `[Метод add()] Стек вернул: ${parseFloat(d.a) + parseFloat(d.b)}` }
        ]
      },

      {
        id: 7,
        badge: "ЭТАП 08 / 08",
        title: "Инженерная математика: Рекурсия и факториал",
        memorySnapshot: {
          stack: [
            { method: "factorial(1)", vars: ["n = 1 -> Return 1 (Базовый случай)"] },
            { method: "factorial(2)", vars: ["n = 2 -> 2 * factorial(1)"] },
            { method: "factorial(3)", vars: ["n = 3 -> 3 * factorial(2)"] },
            { method: "main()", vars: ["res = 6"] }
          ],
          heap: [{ obj: "Call Stack Limit", data: "Thread Stack Size (-Xss1m)" }]
        },
        theory: `
          <h3>Рекурсивные вызовы и стек</h3>
          <p>Рекурсия — это вызов методом самого себя. В инженерном калькуляторе рекурсивно вычисляют факториал числа <code>n! = n * (n - 1)!</code>:</p>
          <pre class="code-inline" style="display:block; padding:8px; margin:8px 0;">
public static long factorial(int n) {
    if (n <= 1) return 1;          // 1. Базовый случай (терминал остановки)
    return n * factorial(n - 1);   // 2. Шаг рекурсии
}
          </pre>
          <p>Если забыть базовый случай, программа будет бесконечно плодить стековые фреймы, пока память стека не переполнится ошибкой <strong>StackOverflowError</strong>.</p>
          <p><strong>Твой квест:</strong> Напиши метод <code>public static long factorial(int n)</code> и выведи в <code>main</code> результат <code>factorial(5)</code>.</p>
        `,
        pitfalls: `
          <h3>Частые грабли</h3>
          <ul>
            <li>Отсутствие проверки <code>if (n <= 1) return 1;</code> намертво подвесит программу с <code>StackOverflowError</code>.</li>
            <li>Факториал растет с огромной скоростью: для чисел больше 12 тип <code>int</code> переполняется, поэтому возвращаемым типом должен быть <code>long</code>.</li>
          </ul>
        `,
        examTest: [
          {
            q: "Что физически вызывает ошибку java.lang.StackOverflowError в JVM?",
            options: [
              "Нехватка оперативной памяти в куче (Heap Out of Memory)",
              "Слишком большое количество вложенных вызовов методов, превысившее лимит размера стека потока (-Xss)",
              "Попытка деления длинного числа на ноль",
              "Сбой сборщика мусора при очистке объектов"
            ],
            correct: 1,
            explain: "Каждый рекурсивный вызов занимает стек новым фреймом. Когда глубина рекурсии исчерпывает выделенный размер стека потока, JVM бросает StackOverflowError.",
            advice: "Всегда строго проверяй наличие и достижимость базового условия выхода из рекурсии."
          },
          {
            q: "Какую роль в рекурсивном методе играет базовый случай (Base Case)?",
            options: [
              "Ускоряет вычисления с помощью кэширования",
              "Служит терминальным условием, останавливающим дальнейшую цепочку рекурсивных вызовов",
              "Выделяет память под массив",
              "Защищает переменные от сборщика мусора"
            ],
            correct: 1,
            explain: "Без базового случая функция будет вызывать саму себя до исчерпания стековой памяти потока.",
            advice: "Повтори обязательные элементы рекурсивной функции."
          }
        ],
        quiz: {
          question: "Чему равен 4! (факториал 4)?",
          options: ["10", "16", "24", "48"],
          correct: 2,
          hint: "4 * 3 * 2 * 1 = 24."
        },
        starterCode: `public class Calculator {
    // 1. Напиши рекурсивный метод factorial:
    public static long factorial(int n) {
        // Базовый случай:
        
        // Шаг рекурсии:
        
    }

    public static void main(String[] args) {
        // 2. Выведи factorial(5) (должно получиться 120):
        
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
        hint: 'if (n <= 1) return 1; return n * factorial(n - 1); в main: System.out.println(factorial(5));',
        tests: [
          { name: "Сигнатура public static long factorial(int n)", check: (c) => /public\s+static\s+long\s+factorial\s*\(\s*int\s+n\s*\)/.test(c), expected: "public static long factorial(int n)" },
          { name: "Базовый случай n <= 1", check: (c) => c.includes("n <= 1") || c.includes("n == 1") || c.includes("n <= 0"), expected: "if (n <= 1) return 1;" },
          { name: "Шаг рекурсии n * factorial(n - 1)", check: (c) => c.includes("factorial(n - 1)") || c.includes("factorial(n-1)"), expected: "return n * factorial(n - 1);" },
          { name: "Вызов factorial(5) в main", check: (c) => c.includes("factorial(5)"), expected: "System.out.println(factorial(5));" }
        ],
        interactiveFlow: [
          { prompt: "Введите число для вычисления факториала (например, 5):", key: "n", onDone: (d) => {
            const num = parseInt(d.n, 10);
            let res = 1;
            for (let i = 2; i <= num; i++) res *= i;
            return `[Call Stack Depth: ${num}] Результат ${num}! = ${res}`;
          }}
        ]
      }
    ]
  }
};