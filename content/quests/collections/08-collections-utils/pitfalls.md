## Частые грабли

-   **`Collections` и `Collection`.** `Collection` — интерфейс всех коллекций, `Collections` с буквой «s» — класс с утилитами. Методы `max`, `sort`, `reverse` есть у второго.
-   **`reverse` без сортировки.** `Collections.reverse` просто разворачивает текущий порядок. Для убывания сначала отсортируй.
-   **Изменение `List.of`.** `List.of(1, 2).add(3)` скомпилируется, но упадёт при запуске с «UnsupportedOperationException».
-   **`max` у пустого списка.** Бросит «NoSuchElementException».
