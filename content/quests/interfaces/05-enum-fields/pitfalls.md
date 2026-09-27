## Частые грабли

-   **Нет `;` после констант.** Если за списком идут поля, без точки с запятой компилятор выдаст «Syntax error».
-   **`public` у конструктора.** `public Size(...)` в `enum` — ошибка «Illegal modifier for the enum constructor; only private is permitted».
-   **`new Size(...)`.** Создавать константы вручную нельзя: «Cannot instantiate the type Size».
-   **Регистр во вводе.** `Size.valueOf("medium")` бросит исключение: имя должно совпадать буква в букву.
