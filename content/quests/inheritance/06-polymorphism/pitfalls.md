## Частые грабли

-   **Вызов метода наследника через родительскую ссылку.** `zoo[i].meow()` не скомпилируется, если `meow()` есть только у `Cat`: «The method meow() is undefined for the type Animal».
-   **Приведение без проверки.** `(Cat) zoo[i]` для собаки упадёт при запуске с `ClassCastException`. Сначала `instanceof`, потом приведение.
-   **Граница цикла.** `i <= zoo.length` выходит за массив: `ArrayIndexOutOfBoundsException`. Нужно `i < zoo.length`.
-   **Сравнение классов строками.** Проверка по имени вроде `zoo[i].name.equals("Барсик")` не скажет, кошка это или нет. Тип проверяют через `instanceof`.
