## Зачем это нужно

Метод «найди наибольший элемент» для любого `T` не написать: как сравнить два произвольных объекта? Но если известно, что `T` умеет сравниваться, задача решается. **Ограничение** `T extends ...` говорит компилятору: подставлять можно только подходящие типы, и у них есть нужные методы.

## Как это работает

```java
static <T extends Comparable<T>> T minOf(List<T> list) {
    T best = list.get(0);
    for (T item : list) {
        if (item.compareTo(best) < 0) {   // compareTo доступен благодаря ограничению
            best = item;
        }
    }
    return best;
}
```

-   `T extends Comparable<T>` — «T любой, но сравнимый сам с собой». Строки, числа и твои классы с `Comparable` подходят.
-   `T extends Number` — только числа: `Integer`, `Double`, `Long`. У них есть `doubleValue()`.
-   `extends` в ограничении работает и для классов, и для интерфейсов.
-   Попытка передать неподходящий тип — ошибка компиляции, а не падение при запуске.

## Разбор: что выведет программа

```java
static <T extends Number> double total(List<T> list) {
    double sum = 0;
    for (T x : list) {
        sum += x.doubleValue();
    }
    return sum;
}
// System.out.println(total(List.of(1, 2))); System.out.println(total(List.of(0.5, 0.5)));
```

```text
3.0
1.0
```

## Твоё задание

Допиши два метода:

-   `maxOf` — ограничь `T` сравнимыми типами и найди наибольший элемент через `compareTo`;
-   `average` — среднее значение списка чисел через `doubleValue()`.

### Что должна вывести программа

```text
9
яблоко
4.0
2.0
```
