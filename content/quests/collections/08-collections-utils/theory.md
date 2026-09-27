## Зачем это нужно

Найти максимум, посчитать повторы, развернуть список — задачи на каждый день. Писать для них циклы каждый раз незачем: в классе `Collections` есть готовые методы для списков.

## Как это работает

```java
import java.util.Collections;

List<Integer> nums = new ArrayList<>(List.of(4, 1, 4, 9));
Collections.max(nums);            // 9
Collections.min(nums);            // 1
Collections.frequency(nums, 4);   // 2 — сколько раз встречается
Collections.sort(nums);           // [1, 4, 4, 9]
Collections.reverse(nums);        // [9, 4, 4, 1]
Collections.swap(nums, 0, 3);     // [1, 4, 4, 9] — обмен двух элементов
```

`List.of(...)` создаёт **неизменяемый** список. Добавить, удалить или отсортировать его нельзя: любая попытка бросит `UnsupportedOperationException`. Это удобно для данных, которые не должны меняться. Изменяемую копию делают так: `new ArrayList<>(List.of(...))`.

Имя класса исключения даёт `e.getClass().getSimpleName()`.

## Разбор: что выведет программа

```java
List<String> words = new ArrayList<>(List.of("да", "нет", "да"));
Collections.sort(words);
System.out.println(words + " " + Collections.frequency(words, "да"));
```

«да» по алфавиту раньше «нет», и встречается оно дважды:

```text
[да, да, нет] 2
```

## Твоё задание

Список оценок уже создан. Выведи максимум и минимум, число троек, список по возрастанию и по убыванию. Потом попробуй добавить элемент в `List.of(1, 2)`, поймай исключение и выведи имя его класса.

### Что должна вывести программа

```text
Максимум: 9
Минимум: 3
Троек: 3
По возрастанию: [3, 3, 3, 5, 7, 9]
По убыванию: [9, 7, 5, 3, 3, 3]
List.of менять нельзя: UnsupportedOperationException
```
