## Зачем это нужно

Объекты редко живут поодиночке. У грузовика есть водитель, у книги — читатель, у кота — хозяин. Связь объектов — это поле, в котором лежит **ссылка на другой объект**.

## Как это работает

```java
class Driver {
    String name;
    Driver(String name) { this.name = name; }
}

class Truck {
    String model;
    Driver driver;              // поле-ссылка: пока null, водителя нет

    Truck(String model) { this.model = model; }

    void assignDriver(Driver driver) {
        this.driver = driver;
        System.out.println("Водитель " + driver.name + " назначен на " + model);
    }
}
```

-   Поле `driver` хранит ссылку на объект `Driver`. Пока водителя не назначили, там `null`.
-   `assignDriver` получает водителя параметром и запоминает ссылку в поле. Сам водитель не копируется: и в `main`, и в грузовике ссылка на одного и того же человека.
-   Прежде чем читать поля через ссылку, проверяют её на `null`:

```java
void printInfo() {
    if (driver == null) {
        System.out.println("Грузовик " + model + ", водитель: нет");
    } else {
        System.out.println("Грузовик " + model + ", водитель: " + driver.name);
    }
}
```

## Разбор: что выведет программа

```java
Driver ivan = new Driver("Иван");
Truck t = new Truck("КамАЗ");
t.assignDriver(ivan);
ivan.name = "Иван Петров";
System.out.println(t.driver.name);
```

`t.driver` и `ivan` указывают на один объект. После смены имени через `ivan` грузовик видит новое имя. Выведется `Иван Петров`.

## Твоё задание

Опиши классы `Driver` и `Truck` с методами `assignDriver` и `printInfo`. В `main` прочитай модель грузовика и имя водителя, выведи грузовик без водителя, назначь водителя и выведи грузовик снова.

### Что должна вывести программа

При вводе `Газель Иван`:

```text
Грузовик Газель, водитель: нет
Водитель Иван назначен на Газель
Грузовик Газель, водитель: Иван
```
