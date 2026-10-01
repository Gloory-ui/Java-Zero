## Частые грабли

-   **`public class Cat` во втором классе.** В одном файле только один `public`-класс. Компилятор ответит `class Cat is public, should be declared in a file named Cat.java`.
-   **Поле без объекта.** `Cat barsik; barsik.name = "Барсик";` не скомпилируется: переменная есть, а кота нет. Нужно `Cat barsik = new Cat();`.
-   **Один объект на двоих.** `Cat murka = barsik;` не создаёт второго кота. Поменяешь имя Мурке — поменяется и у Барсика.
