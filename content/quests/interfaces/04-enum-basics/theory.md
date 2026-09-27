## Зачем это нужно

У светофора три сигнала. Можно хранить их строками `"RED"`, `"GREEN"`, но тогда опечатка `"GRENN"` пройдёт незаметно. **Перечисление** (`enum`) задаёт закрытый список значений: компилятор знает их все и не пропустит лишнее.

## Как это работает

```java
enum Season { WINTER, SPRING, SUMMER, AUTUMN }

Season s = Season.SUMMER;
System.out.println(s);            // SUMMER — имя константы
System.out.println(s.ordinal());  // 2 — номер с нуля
Season[] all = Season.values();   // все значения по порядку
Season w = Season.valueOf("WINTER"); // из строки
```

Значения `enum` сравнивают через `==`: каждая константа существует в одном экземпляре.

Удобнее всего разбирать `enum` через `switch` со стрелками. Такой `switch` возвращает значение:

```java
static String weather(Season s) {
    return switch (s) {
        case WINTER -> "снег";
        case SPRING, AUTUMN -> "дождь";
        case SUMMER -> "жара";
    };
}
```

-   Внутри `case` пишут имя константы без `Season.`.
-   После `->` одно значение, `break` не нужен.
-   Если перечислены все константы, `default` не нужен: компилятор проверит, что ни одна не забыта.

## Разбор: что выведет программа

```java
for (Season s : Season.values()) {
    System.out.println(s.ordinal() + " " + s + ": " + weather(s));
}
```

```text
0 WINTER: снег
1 SPRING: дождь
2 SUMMER: жара
3 AUTUMN: дождь
```

## Твоё задание

Перечисление `Light` уже есть. Допиши метод `action` через `switch`: `RED` — «стой», `YELLOW` — «жди», `GREEN` — «иди».

Потом выведи, какой сигнал идёт после `GREEN`. Следующий сигнал — элемент `values()` с номером `(ordinal() + 1) % values().length`: после последнего снова первый.

### Что должна вывести программа

```text
0 RED: стой
1 YELLOW: жди
2 GREEN: иди
После GREEN: RED
```
