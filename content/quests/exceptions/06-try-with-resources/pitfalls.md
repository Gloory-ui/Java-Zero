## Частые грабли

-   **Класс не `AutoCloseable`.** `try (Door d = new Door("A"))` без `implements AutoCloseable` — ошибка «The resource type Door does not implement java.lang.AutoCloseable».
-   **`close()` с `throws Exception`.** Если скопировать заголовок из интерфейса целиком, компилятор потребует ловить `Exception` у каждого `try`. Без `throws` в своём `close()` этого не нужно.
-   **Ресурс вне скобок.** `Door d = new Door("A"); try { ... }` — обычный `try`, и сам `close()` не вызовется.
-   **Ожидание прямого порядка.** Двери закрываются в обратном порядке: B, потом A.
