## Частые грабли

-   **`Predicate<int>`.** Параметры типа — только классы: `Predicate<Integer>`. Для примитивов есть отдельные `IntPredicate`, `IntFunction`.
-   **Вызов не тем методом.** У `Predicate` — `test`, у `Function` — `apply`, у `Consumer` — `accept`, у `Supplier` — `get`. Перепутаешь — «The method apply(String) is undefined for the type Predicate<String>».
-   **`andThen` в обратном порядке.** `f.andThen(g)` — сначала `f`, потом `g`. Для обратного порядка есть `f.compose(g)`.
