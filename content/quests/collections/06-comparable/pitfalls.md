## Частые грабли

-   **Вычитание вместо `compare`.** `return this.score - other.score;` работает, пока числа небольшие. Для огромных значений вычитание переполнится, и порядок сломается. `Integer.compare` безопасен.
-   **Не тот порядок.** `Integer.compare(this.score, other.score)` сортирует по возрастанию. Для убывания поменяй аргументы местами.
-   **`Comparable` без типа.** `implements Comparable` без `<Player>` потребует `compareTo(Object o)` с приведением типа. Указывай тип в угловых скобках.
-   **Сортировка без `Comparable`.** `Collections.sort` для класса без него не скомпилируется: «The method sort(List<T>) ... is not applicable».
