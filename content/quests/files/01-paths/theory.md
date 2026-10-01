## Зачем это нужно

Всё, что программа хранит в переменных, исчезает, когда она завершается. Заметки, сохранения игры, настройки нужно записать в **файл** — тогда они переживут перезапуск. В Java для этого есть два главных класса: `Path` — адрес файла и `Files` — действия с файлами.

## Как это работает

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

Path dir = Path.of("notes");            // адрес папки, относительно рабочей папки программы
Path file = dir.resolve("todo.txt");    // адрес файла внутри неё
file.getFileName();                     // todo.txt
file.getParent();                       // notes

Files.createDirectories(dir);           // создать папку, если её ещё нет
Files.writeString(file, "текст");       // записать строку, старое содержимое пропадёт
Files.exists(file);                     // true
Files.size(file);                       // размер в байтах
Files.deleteIfExists(file);             // удалить, если есть
```

-   `Path` — только адрес. Создать объект `Path` не значит создать файл.
-   Почти все методы `Files` бросают `IOException` — проверяемое исключение. Проще всего объявить его у `main`: `public static void main(String[] args) throws IOException`.
-   Текст в файл пишется в кодировке UTF-8: латинская буква занимает 1 байт, русская — 2.
-   В этой лаборатории файлы живут в песочнице браузера. После перезагрузки страницы они остаются.

## Разбор: что выведет программа

```java
Path p = Path.of("data").resolve("log.txt");
System.out.println(p.getFileName() + " в папке " + p.getParent());
System.out.println(Files.exists(p));
```

Папку и файл никто не создавал, `Path` — просто адрес:

```text
log.txt в папке data
false
```

## Твоё задание

Создай папку `lab12` и в ней файл `hello.txt`. Удали его, если он остался с прошлого запуска, и проверь, есть ли он. Запиши в файл «Привет, файл!» и проверь снова. Выведи имя файла, его папку и размер в байтах.

### Что должна вывести программа

```text
Есть до записи: false
Есть после записи: true
Имя: hello.txt
Папка: lab12
Размер в байтах: 23
```
