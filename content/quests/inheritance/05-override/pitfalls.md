## Частые грабли

-   **Опечатка без `@Override`.** `void Speak()` или `void spek()` — новый метод, а не переопределение. С `@Override` компилятор сразу скажет: «must override or implement a supertype method».
-   **Другие параметры.** `void speak(String sound)` — это перегрузка, а не переопределение. Для объекта всё равно сработает старый `speak()`.
-   **Строже доступ.** Если у родителя метод `public`, наследник не может сделать его `private` или без модификатора: «Cannot reduce the visibility of the inherited method».
-   **`super.speak()` в main.** `super` работает только внутри методов наследника. В `main` его писать нельзя.
