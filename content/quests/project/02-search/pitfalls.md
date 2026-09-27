## Частые грабли

-   **`Optional.of(books.get(id))`.** Для незнакомого номера `get` вернёт `null`, и `Optional.of` бросит «NullPointerException». Нужен `Optional.ofNullable`.
-   **`equals` для автора.** «булгаков» и «Булгаков» не равны через `equals`. Используй `equalsIgnoreCase`.
-   **Регистр только с одной стороны.** `title.toLowerCase().contains("МИР")` не найдёт ничего: слово для поиска тоже приводи к нижнему регистру.
