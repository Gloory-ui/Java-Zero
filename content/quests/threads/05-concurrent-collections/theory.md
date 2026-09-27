## Зачем это нужно

Несколько потоков одновременно пишут в общий словарь — обычный `HashMap` от этого ломается: теряет записи или даже зацикливается внутри. Оборачивать каждую операцию в `synchronized` утомительно. В `java.util.concurrent` есть коллекции, которые сами рассчитаны на работу из многих потоков.

## Как это работает

```java
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

Map<String, Integer> counts = new ConcurrentHashMap<>();
counts.merge("кот", 1, Integer::sum);   // нет ключа — положить 1, есть — прибавить 1

List<String> events = new CopyOnWriteArrayList<>();
events.add("старт");                    // безопасно из любого потока
```

-   `ConcurrentHashMap` разрешает одновременную запись из многих потоков.
-   `merge(ключ, значение, функция)` атомарно объединяет новое значение со старым. Для счётчиков это ровно то, что нужно.
-   `CopyOnWriteArrayList` при каждой записи делает копию. Он хорош, когда пишут редко, а читают часто.
-   Порядок в `ConcurrentHashMap` непредсказуем. Для вывода по алфавиту его копируют в `TreeMap`: `new TreeMap<>(counts)`.

## Разбор: что выведет программа

```java
Map<Character, Integer> m = new ConcurrentHashMap<>();
for (char c : "абба".toCharArray()) {
    m.merge(c, 1, Integer::sum);
}
System.out.println(new TreeMap<>(m));
```

```text
{а=2, б=2}
```

## Твоё задание

Три текста обрабатываются в пуле: каждая задача разбивает свой текст на слова и считает их в общем `ConcurrentHashMap` через `merge`. Закончив, задача записывает «текст N» в список готовых. Выведи счётчики по алфавиту, общее число слов и список готовых по порядку.

### Что должна вывести программа

```text
Слова: {кот=3, лис=3, пёс=2}
Всего слов: 8
Готово: [текст 1, текст 2, текст 3]
```
