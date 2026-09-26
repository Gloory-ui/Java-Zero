## Частые грабли

-   **Отличаются только имена параметров.** `sayHi(String guest)` и `sayHi(String name)` — одна и та же версия, компилятор скажет `method sayHi(String) is already defined`.
-   **`this(...)` не первой строкой.** Сначала другой конструктор, потом остальное, иначе ошибка `call to this must be first statement in constructor`.
-   **Пустой конструктор без полей.** `Cat() { }` оставит имя `null`. Значения по умолчанию нужно задать явно.
