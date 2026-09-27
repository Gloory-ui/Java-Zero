## Частые грабли

-   **`reversed()` не в том месте.** `Comparator.comparing(Book::author).thenComparing(Book::title).reversed()` перевернёт оба ключа сразу. Переворачивай только то правило, которое нужно.
-   **`Book::year()` со скобками.** Ссылка на метод пишется без скобок: `Book::year`.
-   **Сортировка `List.of`.** Список из `List.of(...)` неизменяемый, и `sort` бросит «UnsupportedOperationException». Скопируй его в `new ArrayList<>(...)`.
