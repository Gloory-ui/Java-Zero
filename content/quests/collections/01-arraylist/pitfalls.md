## Частые грабли

-   **`ArrayList<int>`.** Примитивный тип в угловых скобках — ошибка «Syntax error, insert "Dimensions" to complete ReferenceType». Пиши `ArrayList<Integer>`.
-   **`length` вместо `size()`.** У списка нет поля `length`: «length cannot be resolved or is not a field».
-   **Индекс за границей.** `list.get(list.size())` бросит «IndexOutOfBoundsException». Последний индекс — `size() - 1`.
-   **Забыт `import`.** Без `import java.util.ArrayList;` компилятор напишет «ArrayList cannot be resolved to a type».
