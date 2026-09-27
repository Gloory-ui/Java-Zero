## Частые грабли

-   **`HashMap` вместо `TreeMap`.** `groupingBy` без `TreeMap::new` соберёт `HashMap`, и порядок групп будет непредсказуемым.
-   **Лишний `map` перед `groupingBy`.** Если сначала сделать `map(Student::name)`, группу по `group()` уже не определить: в потоке остались только строки.
-   **`joining` для чисел.** `Collectors.joining` склеивает только строки. Числа сначала превращают: `map(String::valueOf)`.
-   **Объекты вместо имён.** `partitioningBy(условие)` без второго коллектора соберёт записи целиком. Для имён нужен `mapping(Student::name, Collectors.toList())`.
