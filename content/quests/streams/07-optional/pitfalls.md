## Частые грабли

-   **`get()` без проверки.** `optional.get()` у пустого `Optional` бросит «NoSuchElementException». Бери значение через `orElse` или `ifPresent`.
-   **Печать самой коробки.** `System.out.println(opt)` напечатает «Optional[Аня]». Нужное значение достают через `map` и `orElse`.
-   **`Optional.of(null)`.** Бросит `NullPointerException`. Для значения, которое может быть `null`, есть `Optional.ofNullable`.
