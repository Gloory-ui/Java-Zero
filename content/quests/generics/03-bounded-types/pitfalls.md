## Частые грабли

-   **Нет ограничения.** В `static <T> T maxOf(...)` вызов `item.compareTo(best)` не скомпилируется: «The method compareTo(T) is undefined for the type T».
-   **Сравнение через `>`.** `item > best` для объектов не работает — только `compareTo`.
-   **Целочисленное среднее.** Если копить сумму в `int`, среднее 2, 3, 7 выйдет 4, а не 4.0, а для дробей всё сломается. Складывай `doubleValue()` в `double`.
