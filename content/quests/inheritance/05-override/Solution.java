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
        super.speak();
        System.out.println(name + ": Гав!");
    }
}

public class Inheritance {
    public static void main(String[] args) {
        new Cat("Барсик").speak();
        new Dog("Шарик").speak();
        new Animal("Ёжик").speak();
    }
}
