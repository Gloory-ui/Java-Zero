/**
 * Объяснения ошибок по-русски. Компилятор ECJ и JVM пишут по-английски, а новичок застревает именно на этом.
 * Правила проверяются по порядку, срабатывает первое подходящее. Один источник и для лаборатории, и для справочника.
 */
export type Explanation = { title: string; fix: string };

type Rule = { pattern: RegExp; explain: (m: RegExpMatchArray) => Explanation };

const TYPE_HINTS: Record<string, string> = {
  string: "Типы пишутся с большой буквы: String, а не string.",
  Scanner: "Добавь в самое начало файла строку import java.util.Scanner;",
  system: "Правильно System — с большой буквы.",
};

const COMPILER_RULES: Rule[] = [
  {
    pattern: /Syntax error, insert "([^"]+)" to complete/,
    explain: ([, token]) => ({
      title: `Не хватает «${token}»`,
      fix:
        token === ";"
          ? "Каждая команда заканчивается точкой с запятой. Поставь «;» в конце строки с ошибкой или строки перед ней."
          : `Компилятор ждал «${token}» на этом месте. Проверь, что каждая открытая скобка закрыта.`,
    }),
  },
  {
    pattern: /Syntax error on token "([^"]+)", delete this token/,
    explain: ([, token]) => ({
      title: `Лишний символ «${token}»`,
      fix: `Удали «${token}» или проверь, на своём ли он месте. Частая причина — «;» сразу после if (...) или for (...).`,
    }),
  },
  {
    pattern: /Syntax error on token "([^"]+)"/,
    explain: ([, token]) => ({
      title: `Компилятор не понял «${token}»`,
      fix: "Проверь скобки, кавычки и точки с запятой рядом с этим местом. Часто ошибка в строке выше.",
    }),
  },
  {
    pattern: /String literal is not properly closed/,
    explain: () => ({
      title: "Строка не закрыта",
      fix: 'У текста нет закрывающей кавычки. Строка начинается и заканчивается двойной кавычкой: "Привет".',
    }),
  },
  {
    pattern: /Invalid character constant/,
    explain: () => ({
      title: "В одинарных кавычках больше одного символа",
      fix: "В одинарные кавычки кладут ровно один символ: '+'. Для текста нужны двойные: \"Привет\".",
    }),
  },
  {
    pattern: /Type mismatch: cannot convert from String to char/,
    explain: () => ({
      title: "Строка вместо символа",
      fix: "Символ char пишут в одинарных кавычках: case '+', а не case \"+\".",
    }),
  },
  {
    pattern: /Type mismatch: cannot convert from (\S+) to (\S+)/,
    explain: ([, from, to]) => ({
      title: `Тип ${from} не помещается в ${to}`,
      fix:
        from === "double" && to === "int"
          ? "В int нельзя положить дробное число. Сделай переменную double или приведи явно: (int) x — дробная часть отбросится."
          : `Значение типа ${from} нельзя сохранить в переменную типа ${to}. Поменяй тип переменной или само значение.`,
    }),
  },
  {
    pattern: /(\w+) cannot be resolved to a type/,
    explain: ([, name]) => ({
      title: `Тип «${name}» не найден`,
      fix: TYPE_HINTS[name] ?? "Проверь написание: Java различает большие и маленькие буквы.",
    }),
  },
  {
    pattern: /(\w+) cannot be resolved to a variable/,
    explain: ([, name]) => ({
      title: `Переменная «${name}» не объявлена`,
      fix: `Объяви её перед использованием, например int ${name} = 0; Проверь опечатки. Переменная, созданная внутри { }, снаружи не видна.`,
    }),
  },
  {
    pattern: /(\w+) cannot be resolved or is not a field/,
    explain: ([, name]) => ({
      title: `Поля «${name}» нет`,
      fix: "Проверь название. У массива длина — length без скобок, у строки — length() со скобками.",
    }),
  },
  {
    pattern: /(\w+) cannot be resolved/,
    explain: ([, name]) => ({
      title: `«${name}» не найдено`,
      fix: `Проверь написание: Java различает регистр. ${TYPE_HINTS[name] ?? "Например, System, а не system."}`,
    }),
  },
  {
    pattern: /The method (\w+)\(([^)]*)\) is undefined for the type (\w+)/,
    explain: ([, method, , type]) => ({
      title: `У ${type} нет метода ${method}`,
      fix: "Проверь название и регистр: println, а не printLn; nextInt, а не nextint. Проверь и типы аргументов в скобках.",
    }),
  },
  {
    pattern: /The local variable (\w+) may not have been initialized/,
    explain: ([, name]) => ({
      title: `У «${name}» нет значения`,
      fix: `Переменную объявили, но значение не присвоили. Задай начальное значение: например, int ${name} = 0;`,
    }),
  },
  {
    pattern: /This method must return a result of type (\S+)/,
    explain: ([, type]) => ({
      title: "Метод не всегда возвращает результат",
      fix: `Метод обещал вернуть ${type}, но есть путь без return. Добавь return в конце метода или в каждой ветке if/else.`,
    }),
  },
  {
    pattern: /Unreachable code/,
    explain: () => ({
      title: "Код никогда не выполнится",
      fix: "Строка стоит после return, break, continue или бесконечного цикла. Перенеси её выше или убери.",
    }),
  },
  {
    pattern: /Duplicate local variable (\w+)/,
    explain: ([, name]) => ({
      title: `«${name}» объявлена дважды`,
      fix: `Тип пишут только при первом объявлении: int ${name} = 0; Дальше просто ${name} = 5; без int.`,
    }),
  },
  {
    pattern: /The public type (\w+) must be defined in its own file/,
    explain: ([, name]) => ({
      title: `Класс ${name} не совпадает с именем файла`,
      fix: "Публичный класс называется так же, как файл этапа. Верни имя класса из стартового кода.",
    }),
  },
  {
    pattern: /The operator (\S+) is undefined for the argument type\(s\) (.+)/,
    explain: ([, op, types]) => ({
      title: `Оператор ${op} не работает с ${types}`,
      fix:
        op === "&&" || op === "||" || op === "!"
          ? `${op} соединяет условия (boolean): i % 2 == 0 && i % 3 == 0. Сравнение «== 0» нужно писать в каждой части.`
          : "Проверь типы с обеих сторон оператора: например, строку нельзя умножать, а boolean — складывать.",
    }),
  },
  {
    pattern: /Incompatible operand types (\S+) and (\S+)/,
    explain: ([, a, b]) => ({
      title: `Нельзя сравнить ${a} и ${b}`,
      fix: 'Сравнивай значения одного типа: число с числом, символ с символом. "5" и 5 — разные вещи.',
    }),
  },
  {
    pattern: /Cannot make a static reference to the non-static (?:method|field) (\w+)/,
    explain: ([, name]) => ({
      title: `«${name}» нужно объявить static`,
      fix: "Из main (он static) можно вызывать только static-методы. Объяви метод так: public static int имя(...).",
    }),
  },
  {
    pattern: /Void methods cannot return a value/,
    explain: () => ({
      title: "void-метод не возвращает значение",
      fix: "Убери значение после return или замени void на тип результата, например int.",
    }),
  },
  {
    pattern: /Return type for the method is missing/,
    explain: () => ({
      title: "У метода не указан тип результата",
      fix: "Перед именем метода нужен тип: static int sum(int a, int b) или static void print(...).",
    }),
  },
  {
    pattern: /Duplicate case/,
    explain: () => ({
      title: "Две одинаковые метки case",
      fix: "Каждое значение в switch встречается один раз. Удали или исправь повтор.",
    }),
  },
  {
    pattern: /Cannot invoke (\S+) on the primitive type (\w+)/,
    explain: ([, , type]) => ({
      title: `У ${type} нет методов`,
      fix: `${type} — простое значение, а не объект: вызывать у него методы через точку нельзя.`,
    }),
  },
];

const RUNTIME_RULES: Rule[] = [
  {
    pattern: /InputMismatchException/,
    explain: () => ({
      title: "Ввод не подходит по типу",
      fix: "nextInt ждёт целое число, nextDouble — число с точкой (3.5). Проверь поле «Ввод для программы».",
    }),
  },
  {
    pattern: /NoSuchElementException/,
    explain: () => ({
      title: "Ввод закончился",
      fix: "Программа читает больше значений, чем ты ввёл. Заполни поле «Ввод для программы»: значения через пробел или с новой строки.",
    }),
  },
  {
    pattern: /ArithmeticException: \/ by zero/,
    explain: () => ({
      title: "Деление на ноль",
      fix: "Целое число нельзя делить на 0. Перед делением проверь делитель: if (b != 0).",
    }),
  },
  {
    pattern: /ArrayIndexOutOfBoundsException: Index (-?\d+) out of bounds for length (\d+)/,
    explain: ([, index, length]) => ({
      title: "Выход за границы массива",
      fix: `У массива длины ${length} индексы от 0 до ${Number(length) - 1}, а программа обратилась к ${index}. Проверь условие цикла: i < arr.length, а не i <= arr.length.`,
    }),
  },
  {
    pattern: /StringIndexOutOfBoundsException/,
    explain: () => ({
      title: "Выход за границы строки",
      fix: "charAt(i) работает для i от 0 до length() - 1. Возможно, строка пустая.",
    }),
  },
  {
    pattern: /StackOverflowError/,
    explain: () => ({
      title: "Рекурсия не остановилась",
      fix: "Метод вызывает сам себя без конца. Проверь базовый случай, например if (n <= 1) return 1;",
    }),
  },
  {
    pattern: /NullPointerException/,
    explain: () => ({
      title: "Объект не создан",
      fix: "Переменная ссылается на null. Создай объект через new, прежде чем вызывать у него методы.",
    }),
  },
  {
    pattern: /NumberFormatException/,
    explain: () => ({
      title: "Текст не превращается в число",
      fix: "В строке есть не только цифры. Проверь ввод и лишние пробелы.",
    }),
  },
  {
    pattern: /OutOfMemoryError/,
    explain: () => ({
      title: "Не хватило памяти",
      fix: "Программа создаёт слишком много данных, чаще всего в цикле, который не заканчивается.",
    }),
  },
];

function firstMatch(rules: Rule[], message: string): Explanation | null {
  for (const rule of rules) {
    const m = message.match(rule.pattern);
    if (m) return rule.explain(m);
  }
  return null;
}

/** Объяснение ошибки компиляции или null, если сообщение незнакомое. */
export function explainCompileError(message: string): Explanation | null {
  return firstMatch(COMPILER_RULES, message);
}

/** Объяснение исключения при запуске (текст из драйвера: «java.lang.X: …\n\tat main (строка N)»). */
export function explainRuntimeError(error: string): Explanation | null {
  return firstMatch(RUNTIME_RULES, error);
}

/** Строка кода, где упала программа, из описания драйвера. */
export function runtimeErrorLine(error: string): number | null {
  const m = error.match(/\(строка (\d+)\)/);
  return m ? Number(m[1]) : null;
}

/** Примеры для справочника: настоящие сообщения компилятора и то, что они значат. */
export const HANDBOOK_ERRORS: readonly string[] = [
  'Syntax error, insert ";" to complete BlockStatements',
  "x cannot be resolved to a variable",
  "string cannot be resolved to a type",
  "Scanner cannot be resolved to a type",
  "Type mismatch: cannot convert from double to int",
  "Type mismatch: cannot convert from String to char",
  "The local variable x may not have been initialized",
  "The operator && is undefined for the argument type(s) int, int",
  "This method must return a result of type long",
  "Unreachable code",
  "Duplicate local variable x",
  "String literal is not properly closed by a double-quote",
];
