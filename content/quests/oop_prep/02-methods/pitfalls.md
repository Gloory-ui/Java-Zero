## Частые грабли

-   **Нет `return` в методе с типом.** `int getVolume() { int v = length * width * height; }` не скомпилируется: `missing return statement`.
-   **`return` в методе `void`.** `void printInfo() { return 5; }` — ошибка: `void` ничего не возвращает.
-   **Метод без скобок.** `truck.getVolume` компилятор примет за поле и не найдёт: `cannot find symbol`. Вызов — всегда со скобками.
-   **Результат потерян.** `truck.getVolume();` посчитает объём и выбросит его. Результат нужно напечатать или сохранить.
