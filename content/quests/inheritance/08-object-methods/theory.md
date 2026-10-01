## Зачем это нужно

У каждого класса в Java есть общий предок — `Object`. От него все объекты получают методы `toString()` и `equals()`. Их стандартные версии почти бесполезны: `println(точка)` напечатает что-то вроде `Point@1b6d3586`, а `equals` сравнит ссылки. Переопредели их, и объекты начнут понятно печататься и честно сравниваться.

## Как это работает

```java
class Book {
    String title;
    public Book(String title) { this.title = title; }

    @Override
    public String toString() {              // println(book) вызовет этот метод
        return "«" + title + "»";
    }

    @Override
    public boolean equals(Object o) {       // параметр — Object, как у предка
        if (!(o instanceof Book)) return false;
        Book other = (Book) o;              // приведение к Book после проверки
        return title.equals(other.title);
    }
}
```

-   `==` для объектов сравнивает **ссылки**: один ли это объект в куче.
-   `equals` сравнивает **содержимое** — так, как ты его определишь.
-   Если переопределяешь `equals`, по правилам Java переопределяют и `hashCode()`. Это понадобится в квесте про коллекции.
-   `final` запрещает менять дальше: `final class` нельзя наследовать (так устроен `String`), `final`-метод нельзя переопределить, `final`-поле нельзя изменить после присваивания.

## Разбор: что выведет программа

```java
Book x = new Book("Java");
Book y = new Book("Java");
System.out.println(x);
System.out.println(x == y);
System.out.println(x.equals(y));
```

```text
«Java»
false
true
```

Два разных объекта, поэтому `==` даёт `false`, а названия совпадают, и `equals` даёт `true`.

## Твоё задание

В классе `Point` переопредели `toString()` (вид `(x, y)`) и `equals(Object o)` (точки равны, если совпадают обе координаты). `main` печатает точку и три сравнения.

### Что должна вывести программа

```text
(1, 2)
false
true
true
```
