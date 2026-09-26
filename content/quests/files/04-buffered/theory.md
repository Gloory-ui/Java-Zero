## Зачем это нужно

Файл с логами за год весит гигабайты. Прочитать его целиком в список не выйдет: не хватит памяти. Такие файлы читают **построчно**: взяли строку, обработали, взяли следующую. Для этого есть `BufferedReader`, а для записи по строке — `BufferedWriter`.

## Как это работает

```java
try (BufferedWriter out = Files.newBufferedWriter(path)) {
    out.write("первая");
    out.newLine();                    // перевод строки
    out.write("вторая");
    out.newLine();
}                                     // файл закроется и допишется на диск сам

try (BufferedReader in = Files.newBufferedReader(path)) {
    String line;
    while ((line = in.readLine()) != null) {   // null — строки кончились
        System.out.println(line);
    }
}
```

-   Буферизованные потоки копят данные в памяти и работают с диском большими порциями. Это намного быстрее, чем по символу.
-   Их обязательно закрывают. `try`-with-resources делает это сам. Если забыть закрыть писателя, часть текста может не дойти до файла.
-   `readLine()` возвращает следующую строку или `null` в конце файла.
-   Запись `while ((line = in.readLine()) != null)` сначала присваивает, потом сравнивает — это обычный приём для построчного чтения.

## Разбор: что выведет программа

```java
try (BufferedWriter out = Files.newBufferedWriter(p)) {
    out.write("a");
    out.newLine();
    out.write("b");
    out.newLine();
}
int count = 0;
try (BufferedReader in = Files.newBufferedReader(p)) {
    while (in.readLine() != null) {
        count++;
    }
}
System.out.println(count);
```

```text
2
```

## Твоё задание

Прочитай из ввода число `n` и запиши в файл `squares.txt` квадраты чисел от 1 до `n`, по одному на строке, через `BufferedWriter`. Потом прочитай файл через `BufferedReader`, посчитай сумму и запомни последнюю строку.

### Что должна вывести программа

Для ввода `5`:

```text
Записано строк: 5
Сумма: 55
Последняя строка: 25
```
