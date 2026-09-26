class Animal {
    static int count = 0;

    public Animal() {
        // Увеличь общий счётчик животных
    }
}

class Cat extends Animal {
    static int catCount = 0;

    public Cat() {
        // Увеличь счётчик кошек
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
