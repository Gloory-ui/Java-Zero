## Зачем это нужно

«Найди первого отличника» — а если отличников нет? Можно вернуть `null`, но про проверку на `null` легко забыть, и программа упадёт с `NullPointerException`. `Optional` — коробка, в которой значение может быть, а может и не быть. Тип сразу говорит: «проверь, прежде чем брать».

## Как это работает

```java
Optional<String> some = Optional.of("кот");
Optional<String> none = Optional.empty();
Optional<String> maybe = Optional.ofNullable(null);   // пустой, без исключения

some.isPresent();                  // true
none.isEmpty();                    // true
none.orElse("никого");             // "никого" — запасное значение
some.map(String::length);          // Optional[3] — преобразовать, если есть
some.ifPresent(System.out::println); // напечатать, только если есть
```

Потоки возвращают `Optional` там, где результата может не оказаться:

```java
Optional<Integer> first = nums.stream().filter(n -> n > 100).findFirst();
Optional<Integer> biggest = nums.stream().max(Comparator.naturalOrder());
```

-   `findFirst()` — первый элемент потока.
-   `max(компаратор)` и `min(компаратор)` — наибольший и наименьший.
-   Цепочка `map(...).orElse(...)` читается как «если есть — преобразуй, иначе возьми запасное».

## Разбор: что выведет программа

```java
List<String> names = List.of("Ян", "Ия");
String longName = names.stream()
    .filter(n -> n.length() > 5)
    .findFirst()
    .map(String::toUpperCase)
    .orElse("нет длинных");
System.out.println(longName);
```

Длинных имён нет, `findFirst` вернул пустой `Optional`, и `map` пропускается:

```text
нет длинных
```

## Твоё задание

Для списка студентов:

-   найди первого с баллом выше 85 и выведи имя или «никто»;
-   то же для балла выше 95;
-   выведи лучшего через `max` и `ifPresent`;
-   допиши метод `findByName` с `Optional` и выведи баллы Гоши и Жени, а если студента нет — −1.

### Что должна вывести программа

```text
Первый отличник: Аня
Выше 95: никто
Лучший: Аня (90)
Балл Гоши: 48
Балл Жени: -1
```
