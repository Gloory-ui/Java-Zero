## Частые грабли

-   **Общий `catch` выше частного.** `catch (Exception e)` перед `catch (NumberFormatException e)` — ошибка «Unreachable catch block for NumberFormatException. It is already handled by the catch block for Exception». Частные типы пиши выше общих.
-   **Строка журнала в `try`.** Если печатать «--- запрос» в конце `try`, при ошибке она не выведется. Для «всегда» есть `finally`.
-   **Переменная из `try` в `catch`.** Номер, разобранный внутри `try`, в `catch` не виден. В сообщении используй исходную строку-параметр.
