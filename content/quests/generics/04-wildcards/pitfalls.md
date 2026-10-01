## Частые грабли

-   **`List<Number>` в параметре.** Тогда `sumAll(ints)` с `List<Integer>` не скомпилируется: «not applicable for the arguments (List<Integer>)».
-   **`add` в `? extends`.** `list.add(1)` в `List<? extends Number>` — ошибка: компилятор не знает, `Integer` там внутри или `Double`.
-   **Чтение из `? super`.** `Integer x = out.get(0)` не скомпилируется: из `List<? super Integer>` элементы достаются как `Object`.
