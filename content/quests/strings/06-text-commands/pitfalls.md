## Частые грабли

-   **`parts[1]` у команды без аргумента.** Для «PRINT» массив из одной части: «ArrayIndexOutOfBoundsException: Index 1 out of bounds for length 1». Читай число только в ветках, где оно есть.
-   **Регистр.** `case "MUL"` не совпадёт с «mul». Приведи команду к заглавным до `switch`.
-   **`break` в цикле внутри `switch`.** Со стрелками `->` `break` не нужен. Но выход из цикла по «END» через `break` внутри `switch` выйдет только из `switch`. Проверь «END» отдельным `if` до `switch`.
-   **`parseInt` с пробелами.** `Integer.parseInt(" 5")` бросит «NumberFormatException». `trim()` и `split("\\s+")` убирают лишние пробелы.
