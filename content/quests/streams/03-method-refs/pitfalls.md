## Частые грабли

-   **Скобки у ссылки.** `String::trim()` — ошибка. Ссылка пишется без скобок и аргументов.
-   **Точка вместо двух двоеточий.** `System.out.println` без `::` — это вызов, а не ссылка, и он не скомпилируется на месте функции.
-   **Неподходящая сигнатура.** `Function<String, Integer> f = String::length;` работает, а `Function<String, String> f = String::length;` — «Bad return type in method reference»: `length` возвращает `int`, а не `String`.
