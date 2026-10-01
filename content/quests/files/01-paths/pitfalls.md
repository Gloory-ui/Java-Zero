## Частые грабли

-   **Нет `throws IOException`.** `Files.writeString(...)` в `main` без объявления — «Unhandled exception type IOException».
-   **Запись в несуществующую папку.** `Files.writeString(Path.of("lab12/hello.txt"), ...)` без `createDirectories` бросит «NoSuchFileException».
-   **Размер в символах.** «Привет, файл!» — 13 символов, но 23 байта: каждая русская буква в UTF-8 занимает 2 байта.
-   **Слэши в путях.** Не склеивай путь строкой `"lab12" + "/" + "hello.txt"`: в разных системах разделители разные. `resolve` подставит правильный.
