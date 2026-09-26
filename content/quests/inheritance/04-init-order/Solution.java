class Animal {
    static int count = 0;

    public Animal() {
        count++;
    }
}

class Cat extends Animal {
    static int catCount = 0;

    public Cat() {
        catCount++;
    }
}

public class Inheritance {
    public static void main(String[] args) {
        new Cat();
        new Cat();
        new Animal();
        System.out.println("Животных: " + Animal.count);
        System.out.println("Котов: " + Cat.catCount);
    }
}
