class Animal {
    public Animal() {
        System.out.println("Отработал конструктор Animal");
    }
}

class Cat extends Animal {
    public Cat() {
        System.out.println("Отработал конструктор Cat!");
    }
}

public class Inheritance {
    public static void main(String[] args) {
        new Cat();
        System.out.println("---");
        new Animal();
    }
}
