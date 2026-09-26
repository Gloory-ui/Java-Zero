## Зачем это нужно

Пользователь просит открыть файл, которого нет. Или файл есть, но программе запрещено его читать. С файлами такое случается постоянно, и программа должна объяснить, что пошло не так, а не падать.

## Как это работает

Ошибки ввода-вывода — наследники `IOException`:

| Исключение | Когда |
| --- | --- |
| `NoSuchFileException` | файла или папки нет |
| `AccessDeniedException` | нет прав |
| `FileAlreadyExistsException` | файл уже есть, а просили создать новый |

```java
try {
    String text = Files.readString(Path.of("missing.txt"));
} catch (NoSuchFileException e) {
    System.out.println("Такого файла нет");
} catch (IOException e) {
    System.out.println("Не удалось прочитать: " + e.getMessage());
}
```

-   Частный тип `NoSuchFileException` ловят раньше общего `IOException`.
-   `Files.deleteIfExists(path)` возвращает `true`, если файл был и удалён, и `false`, если его не было. Обычный `Files.delete` на отсутствующем файле бросит исключение.
-   Уборка за собой — хорошая привычка: временные файлы программа удаляет сама.

## Разбор: что выведет программа

```java
Path p = Path.of("tmp.txt");
Files.writeString(p, "x");
System.out.println(Files.deleteIfExists(p));
System.out.println(Files.deleteIfExists(p));
```

Первый раз файл был, второй — уже нет:

```text
true
false
```

## Твоё задание

Программа создаёт папку `lab12err` с файлами `a.txt` и `b.txt`. Читай имена файлов из ввода и выводи содержимое каждого. Если файла нет, выведи «Нет файла: имя».

В конце удали из папки файлы `a.txt`, `b.txt` и `c.txt` через `deleteIfExists` и выведи, сколько удалений прошло.

### Что должна вывести программа

Для ввода из примера:

```text
a.txt: альфа
Нет файла: c.txt
b.txt: бета
Удалено файлов: 2
```
