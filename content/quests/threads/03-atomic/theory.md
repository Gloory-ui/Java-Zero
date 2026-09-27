## Зачем это нужно

Для одного счётчика заводить замок — много церемоний. В пакете `java.util.concurrent.atomic` есть **атомарные** переменные: их операции выполняются целиком и потокобезопасно без `synchronized`. Процессор умеет это на уровне одной команды.

## Как это работает

```java
import java.util.concurrent.atomic.AtomicInteger;

AtomicInteger hits = new AtomicInteger();   // начинается с 0
hits.incrementAndGet();                     // +1 и вернуть новое значение
hits.addAndGet(5);                          // +5
hits.get();                                 // прочитать
hits.accumulateAndGet(42, Math::max);       // записать max(текущее, 42)
```

-   Каждая операция атомарна: другой поток не вклинится посередине.
-   `accumulateAndGet(x, функция)` применяет функцию к текущему значению и `x` и записывает результат. Так безопасно искать общий максимум.
-   Для простых флагов есть слово `volatile`: `volatile boolean running;`. Оно гарантирует, что все потоки видят свежее значение. Но `volatile` не делает `count++` атомарным.

## Разбор: что выведет программа

```java
AtomicInteger best = new AtomicInteger(Integer.MIN_VALUE);
Thread a = new Thread(() -> best.accumulateAndGet(7, Math::max));
Thread b = new Thread(() -> best.accumulateAndGet(3, Math::max));
a.start(); b.start(); a.join(); b.join();
System.out.println(best.get());
```

В каком бы порядке ни сработали потоки, максимум — 7:

```text
7
```

## Твоё задание

Три потока обрабатывают массив по кускам из трёх чисел. Каждый поток для каждого числа:

-   увеличивает счётчик обработанных `processed`;
-   добавляет число к общей сумме `sum`;
-   обновляет общий максимум `max`.

Все три — `AtomicInteger`.

### Что должна вывести программа

```text
Обработано: 9
Сумма: 129
Максимум: 42
```
