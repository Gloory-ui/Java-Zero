## Зачем это нужно

Числа и строки Java сортирует сама: известно, что 3 меньше 5, а «Аня» раньше «Бори». А как сравнить двух игроков? По очкам, по имени, по возрасту? Классу нужно объяснить свой **естественный порядок**. Для этого есть интерфейс `Comparable`.

## Как это работает

```java
class Task implements Comparable<Task> {
    String title;
    int priority;

    Task(String title, int priority) {
        this.title = title;
        this.priority = priority;
    }

    @Override
    public int compareTo(Task other) {
        return Integer.compare(this.priority, other.priority);
    }
}
```

`compareTo` возвращает:

-   отрицательное число, если `this` должен стоять **раньше** `other`;
-   ноль, если они равны по порядку;
-   положительное, если `this` — **позже**.

`Integer.compare(a, b)` делает это для чисел: по возрастанию. Для убывания аргументы меняют местами: `Integer.compare(other.priority, this.priority)`.

Отсортировать список: `Collections.sort(list)`. Сортировка устойчивая — равные элементы сохраняют исходный порядок.

## Разбор: что выведет программа

```java
List<Task> tasks = new ArrayList<>(List.of(
    new Task("Стирка", 2), new Task("Экзамен", 1), new Task("Кино", 3)));
Collections.sort(tasks);
for (Task t : tasks) {
    System.out.println(t.priority + " " + t.title);
}
```

`List.of(...)` быстро создаёт список из перечисленных элементов. По возрастанию приоритета:

```text
1 Экзамен
2 Стирка
3 Кино
```

## Твоё задание

Пусть `Player` реализует `Comparable<Player>` так, чтобы больше очков означало раньше в списке. Отсортируй игроков через `Collections.sort` и выведи таблицу мест. У Бориса и Гоши поровну очков — они остаются в исходном порядке.

### Что должна вывести программа

```text
1. Вика — 140
2. Аня — 120
3. Борис — 95
4. Гоша — 95
```
