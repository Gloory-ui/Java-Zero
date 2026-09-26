## Частые грабли

-   **`IOException` выше `NoSuchFileException`.** Общий тип первым — «Unreachable catch block for NoSuchFileException».
-   **Печать `e.getMessage()` для пути.** Сообщение содержит полный путь, а разделители в нём разные на разных системах. Печатай имя, которое ввёл пользователь.
-   **`Files.delete` для отсутствующего файла.** Бросит «NoSuchFileException». Когда файла может не быть, удаляй через `deleteIfExists`.
