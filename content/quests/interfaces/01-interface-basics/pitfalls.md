## Частые грабли

-   **Метод без `public`.** `double area() { ... }` в классе даёт ошибку «Cannot reduce the visibility of the inherited method from Shape». Методы интерфейса публичные, и реализация тоже должна быть `public`.
-   **Реализованы не все методы.** Забыл `name()` — компилятор напишет «The type Rect must implement the inherited abstract method Shape.name()».
-   **`new Shape()`.** Интерфейс — договор, а не класс: «Cannot instantiate the type Shape».
-   **Деление целых.** Будь стороны `int`, `3 * 5 / 2` дало бы 7, а не 7.5. Здесь поля `double`, поэтому площадь считается точно.
