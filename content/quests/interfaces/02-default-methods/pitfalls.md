## Частые грабли

-   **Тело без `default`.** `int withDiscount(int percent) { ... }` в интерфейсе — ошибка «Abstract methods do not specify a body». Метод с телом должен быть помечен `default` или `static`.
-   **Переопределение без `public`.** В классе `int withDiscount(int percent)` без `public` — «Cannot reduce the visibility of the inherited method». Методы интерфейса публичные.
-   **Проценты целыми числами.** `price() * (percent / 100)` даст 0: `10 / 100` в целых — это 0. Сначала умножай, потом дели: `price() * percent / 100`.
