## Частые грабли

-   **Общий `catch` выше частного.** `catch (IllegalArgumentException e)` перед `catch (NumberFormatException e)` — ошибка «Unreachable catch block for NumberFormatException. It is already handled by the catch block for IllegalArgumentException».
-   **Нет `break`.** Без него цикл продолжит читать слова и после правильного возраста, и «30» перезапишет «25».
-   **Нет отметки «принят».** Когда ввод кончился без правильного ответа, нужен признак: например, `int age = -1` или флаг `boolean accepted`.
