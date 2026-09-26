## Частые грабли

-   **`case Light.RED`.** Внутри `switch` по `enum` имя пишут без типа: `case RED ->`. В Java 17 полное имя — ошибка «An enum switch case label must be the unqualified name of an enumeration constant».
-   **Сравнение строкой.** `light.equals("RED")` всегда `false`: константа — не строка. Сравнивай с константой: `light == Light.RED`.
-   **Выход за конец.** `values()[light.ordinal() + 1]` для последнего сигнала выйдет за массив: «ArrayIndexOutOfBoundsException». Остаток `% values().length` возвращает к началу.
-   **Неизвестное имя.** `Light.valueOf("BLUE")` бросит «IllegalArgumentException: No enum constant». Имена чувствительны к регистру.
