## Частые грабли

-   **`range` вместо `rangeClosed`.** `IntStream.range(1, 10)` не включает 10, и сумма квадратов выйдет 285.
-   **`reduce(0, ...)` для произведения.** Начальное значение 0 обнулит всё. Для умножения начинают с 1.
-   **Печать `OptionalDouble`.** `System.out.println(stream.average())` напечатает «OptionalDouble[80.75]». Достань число через `orElse(0)`.
-   **`sum()` у `Stream<Integer>`.** У обычного потока объектов нет `sum()`. Сначала `mapToInt(Integer::intValue)`.
