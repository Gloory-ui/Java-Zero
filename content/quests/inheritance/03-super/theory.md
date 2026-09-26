## Зачем это нужно

Часто у родителя нет конструктора без параметров: животное без имени и возраста не создать. Тогда наследник обязан передать эти данные родителю. Для этого есть ключевое слово `super` — так в Java называют родительский класс, его ещё зовут **суперклассом**.

## Как это работает

```java
class Animal {
    String brain;
    String heart;

    public Animal(String brain, String heart) {
        this.brain = brain;
        this.heart = heart;
    }
}

class Cat extends Animal {
    String tail;

    public Cat(String brain, String heart, String tail) {
        super(brain, heart);    // конструктор Animal заполняет свои поля
        this.tail = tail;       // своё поле Cat заполняет сама
    }
}
```

-   `super(...)` вызывает конструктор родителя с этими аргументами.
-   Он **обязан быть первой строкой** конструктора. Сначала строится часть родителя, потом своя.
-   Если `super(...)` не написан, компилятор подставит `super()` без аргументов. Когда такого конструктора у родителя нет, код не скомпилируется.

## Разбор: что выведет программа

```java
class Dog extends Animal {
    public Dog(String name, int age) {
        super(name, age);
        System.out.println("Собака " + name + " готова");
    }
}
```

`new Dog("Шарик", 4)` сначала заполнит имя и возраст в `Animal`, потом напечатает «Собака Шарик готова».

## Твоё задание

У `Animal` есть конструктор `Animal(String name, int age)`. Допиши конструктор `Cat(String name, int age, String color)`: передай имя и возраст родителю через `super` и сохрани окрас в поле `color`. Метод `info()` и `main` уже готовы.

### Что должна вывести программа

```text
Мурка, 2 г., окрас: рыжий
Снежок, 5 г., окрас: белый
```
