## Частые грабли

-   **`extends` вместо `implements`.** `class Duck extends Swimmer` — ошибка: от интерфейса не наследуют, его реализуют.
-   **Вызов без проверки.** У переменной типа `Object` нет метода `fly()`: `t.fly()` даст «The method fly() is undefined for the type Object». Сначала `instanceof`, потом вызов.
-   **`else if` вместо двух `if`.** С `else if` утка только поплывёт: после первой успешной проверки вторая уже не выполняется.
