## Зачем это нужно

Отчёт по студентам: все имена одной строкой, сколько людей в каждой группе, средний балл по группам, кто сдал, а кто нет. Всё это — сбор потока в сложный результат. Для таких сборок есть класс `Collectors`.

## Как это работает

Коллектор передают в конечный шаг `collect(...)`:

```java
import java.util.stream.Collectors;

// Одна строка через разделитель
String all = people.stream().map(Person::name).collect(Collectors.joining(", "));

// Словарь «город → список людей»
Map<String, List<Person>> byCity = people.stream()
    .collect(Collectors.groupingBy(Person::city));

// «город → сколько людей», ключи по алфавиту
Map<String, Long> counts = people.stream()
    .collect(Collectors.groupingBy(Person::city, TreeMap::new, Collectors.counting()));

// Две группы по условию: false и true
Map<Boolean, List<Person>> adults = people.stream()
    .collect(Collectors.partitioningBy(p -> p.age() >= 18));
```

-   `groupingBy(ключ)` раскладывает элементы по ключу. Второй коллектор решает, что делать с каждой группой: `counting()`, `averagingInt(...)`, `mapping(...)`.
-   Второй аргумент `TreeMap::new` задаёт вид словаря: так ключи идут по алфавиту.
-   `partitioningBy(условие)` — частный случай: ровно две группы, `false` и `true`.
-   `mapping(Person::name, Collectors.toList())` собирает из группы не объекты, а их имена.

## Разбор: что выведет программа

```java
List<String> words = List.of("кот", "кит", "дом");
Map<Character, Long> byFirst = words.stream()
    .collect(Collectors.groupingBy(w -> w.charAt(0), TreeMap::new, Collectors.counting()));
System.out.println(byFirst);
```

«д» по алфавиту раньше «к», на «к» два слова:

```text
{д=1, к=2}
```

## Твоё задание

Для списка студентов выведи через коллекторы:

-   все имена через запятую;
-   сколько студентов в каждой группе, группы по алфавиту;
-   средний балл по группам;
-   кто сдал (балл от 60) и кто нет — только имена.

### Что должна вывести программа

```text
Все: Аня, Борис, Вика, Гоша, Даша
По группам: {ИТ-1=3, ИТ-2=2}
Средний балл: {ИТ-1=70.0, ИТ-2=68.0}
Сдали: {false=[Борис, Гоша], true=[Аня, Вика, Даша]}
```
