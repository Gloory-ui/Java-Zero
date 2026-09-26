## Частые грабли

-   **`super` не первой строкой.** Сначала `this.color = color;`, потом `super(...)` — ошибка «Constructor call must be the first statement in a constructor».
-   **Нет `super` вовсе.** Если у родителя нет конструктора без параметров, компилятор сообщит «Implicit super constructor Animal() is undefined».
-   **Параметр затеняет поле.** `color = color;` присваивает параметр сам себе, поле остаётся `null`. Нужно `this.color = color;`.
-   **Аргументы не в том порядке.** `super(age, name)` не скомпилируется: родитель ждёт сначала строку, потом число.
