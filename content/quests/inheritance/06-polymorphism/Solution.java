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
        for (int i = 0; i < zoo.length; i++) {
            zoo[i].speak();
            if (zoo[i] instanceof Cat) {
                cats++;
            }
        }
        System.out.println("Котов в зоопарке: " + cats);
    }
}
