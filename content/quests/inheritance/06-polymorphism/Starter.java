class Animal {
    String name;

    public Animal(String name) {
        this.name = name;
    }

    void speak() {
        System.out.println(name + " издаёт звук");
    }
}

class Cat extends Animal {
    public Cat(String name) {
        super(name);
    }

    @Override
    void speak() {
        System.out.println(name + ": Мяу");
    }
}

class Dog extends Animal {
    public Dog(String name) {
        super(name);
    }

    @Override
    void speak() {
        System.out.println(name + ": Гав!");
    }
}

public class Inheritance {
    public static void main(String[] args) {
        Animal[] zoo = { new Cat("Барсик"), new Dog("Шарик"), new Cat("Мурка") };
        int cats = 0;
        // Пройди по zoo: у каждого вызови speak() и посчитай кошек через instanceof

        // После цикла выведи: «Котов в зоопарке: <число>»
    }
}
