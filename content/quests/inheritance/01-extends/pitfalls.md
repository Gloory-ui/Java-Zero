## Частые грабли

-   **Забыл `extends`.** Без него `Cat` — отдельный класс без полей: обращение `cat.name` не скомпилируется, «name cannot be resolved».
-   **Поля заново в наследнике.** Если снова объявить `String name;` внутри `Cat`, у объекта станет два поля `name`: одно видит `Cat`, другое — методы `Animal`. `introduce()` напечатает `null`.
-   **`public class Cat`.** В одном файле может быть только один публичный класс, и он называется как файл. Ошибка «The public type Cat must be defined in its own file».
-   **Два родителя.** `class Cat extends Animal, Pet` не скомпилируется: у класса один родитель.
