## Зачем это нужно

Часто лямбда просто вызывает один готовый метод: `s -> s.trim()`, `x -> System.out.println(x)`. Для таких случаев есть запись ещё короче — **ссылка на метод**. Она говорит: «вот этот метод и есть функция».

## Как это работает

| Вид | Ссылка | Та же лямбда |
| --- | --- | --- |
| Статический метод | `Integer::parseInt` | `s -> Integer.parseInt(s)` |
| Метод объекта из параметра | `String::trim` | `s -> s.trim()` |
| Метод конкретного объекта | `System.out::println` | `x -> System.out.println(x)` |
| Конструктор | `ArrayList::new` | `() -> new ArrayList<>()` |

```java
List<String> names = new ArrayList<>(List.of("аня", "борис"));
names.replaceAll(String::toUpperCase);   // заменить каждый элемент результатом функции
names.forEach(System.out::println);      // напечатать каждый
```

-   `list.replaceAll(функция)` заменяет каждый элемент списка.
-   `list.forEach(действие)` выполняет действие для каждого элемента.
-   Ссылку можно положить в переменную функционального типа: `Function<String, Integer> parse = Integer::parseInt;`.

## Разбор: что выведет программа

```java
BiFunction<Integer, Integer, Integer> bigger = Math::max;
Supplier<StringBuilder> fresh = StringBuilder::new;
StringBuilder sb = fresh.get().append(bigger.apply(3, 8));
System.out.println(sb);
```

`Math::max` выбрал 8, а `StringBuilder::new` создал пустой построитель:

```text
8
```

## Твоё задание

Заполни пропуски ссылками на методы:

-   обрежь пробелы у строк через `replaceAll`;
-   переведи строки в числа функцией `parse`;
-   напечатай числа через `forEach`;
-   найди максимум функцией `max`;
-   создай пустой список через `Supplier`.

### Что должна вывести программа

```text
[42, 7, 15]
42
7
15
Максимум: 42
Новый список: []
```
