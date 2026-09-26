## Частые грабли

-   **`equals(Point p)` вместо `equals(Object o)`.** Это перегрузка, а не переопределение. С `@Override` компилятор сразу сообщит об ошибке.
-   **Приведение без проверки.** `(Point) o` для строки или `null` упадёт с `ClassCastException`. Сначала `if (!(o instanceof Point)) return false;`.
-   **Строки через `==`.** Внутри `equals` текстовые поля сравнивают через `equals`, а не `==`.
-   **`toString` без `public`.** В `Object` метод публичный, наследник не может сделать доступ строже: «Cannot reduce the visibility of the inherited method».
