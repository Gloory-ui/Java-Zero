## Зачем это нужно

Класс «студент с именем и баллом» обычно выглядит одинаково: два `private final` поля, конструктор, два геттера, `toString`, `equals` и `hashCode`. Это двадцать строк без мысли. **Запись** (`record`) делает то же самое одной строкой.

## Как это работает

```java
record Point(int x, int y) { }

Point p = new Point(3, 4);
System.out.println(p.x());                  // 3 — геттер без get
System.out.println(p);                      // Point[x=3, y=4]
System.out.println(p.equals(new Point(3, 4))); // true — сравнение по полям
```

-   В скобках после имени — компоненты. Для каждого Java создаёт `private final` поле и метод-геттер с тем же именем: `x()`, `y()`.
-   `toString`, `equals` и `hashCode` тоже готовы.
-   Поля неизменяемые: после создания `x` не поменять.
-   Внутри фигурных скобок можно добавить свои методы.
-   **Компактный конструктор** проверяет или правит данные до записи в поля. Параметры в нём не перечисляют:

```java
record Temperature(int degrees) {
    Temperature {
        if (degrees < -273) degrees = -273;   // правим параметр до записи в поле
    }
}
```

## Разбор: что выведет программа

```java
record Pair(String key, int value) {
    boolean big() { return value > 10; }
}

Pair a = new Pair("x", 20);
System.out.println(a + " " + a.big());
```

```text
Pair[key=x, value=20] true
```

## Твоё задание

Объяви `record Student(String name, int score)`:

-   компактный конструктор срезает балл выше 100 до 100;
-   метод `boolean passed()` возвращает `true` при балле от 60.

Создай Аню (90), Бориса (55) и Вику (120), выведи все три записи, затем для каждого «зачёт» или «незачёт». В конце сравни Аню с новой записью `new Student("Аня", 90)` через `equals`.

### Что должна вывести программа

```text
Student[name=Аня, score=90]
Student[name=Борис, score=55]
Student[name=Вика, score=100]
Аня: зачёт
Борис: незачёт
Вика: зачёт
Записи равны: true
```
