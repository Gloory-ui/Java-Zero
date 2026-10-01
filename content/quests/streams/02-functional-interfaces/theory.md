## Зачем это нужно

Для лямбд «проверить», «преобразовать», «напечатать» писать свой интерфейс каждый раз незачем. В пакете `java.util.function` есть готовые, и ими пользуется вся стандартная библиотека.

## Как это работает

| Интерфейс | Метод | Что делает | Пример |
| --- | --- | --- | --- |
| `Predicate<T>` | `test(T)` → `boolean` | проверяет | `s -> s.isEmpty()` |
| `Function<T, R>` | `apply(T)` → `R` | превращает T в R | `s -> s.length()` |
| `Consumer<T>` | `accept(T)` | что-то делает, ничего не возвращает | `s -> System.out.println(s)` |
| `Supplier<T>` | `get()` → `T` | выдаёт значение | `() -> "по умолчанию"` |
| `BiFunction<T, U, R>` | `apply(T, U)` → `R` | из двух значений одно | `(a, b) -> a + b` |

Их можно комбинировать:

```java
Predicate<String> empty = s -> s.isEmpty();
Predicate<String> notEmpty = empty.negate();         // «не»
Predicate<String> shortWord = s -> s.length() < 4;
Predicate<String> both = notEmpty.and(shortWord);     // «и», есть ещё or

Function<Integer, Integer> twice = x -> x * 2;
Function<Integer, Integer> plusOne = x -> x + 1;
twice.andThen(plusOne).apply(5);                     // (5 * 2) + 1 = 11
```

## Разбор: что выведет программа

```java
Supplier<String> def = () -> "аноним";
Function<String, String> hello = name -> "Привет, " + name;
Consumer<String> show = text -> System.out.println(text + "!");
show.accept(hello.apply(def.get()));
```

`Supplier` выдал имя, `Function` построила фразу, `Consumer` её напечатал:

```text
Привет, аноним!
```

## Твоё задание

Для списка слов:

-   собери длинные слова (длиннее 4 букв), которые начинаются на «к», — через `isLong.and(startsK)`;
-   собери короткие слова — через `isLong.negate()`;
-   выведи длину слова «клавиатура» функцией `len`;
-   «Крик» — функция `loud`: `shout.andThen(...)` дописывает «!» после заглавных букв;
-   напечатай приветствие из `Supplier` через `Consumer`.

### Что должна вывести программа

```text
Длинные на «к»: [компьютер, клавиатура]
Короткие: [кот, окно, мышь]
Длина «клавиатура»: 10
Крик: КОТ!
Приветствие: Привет, Java!
```
