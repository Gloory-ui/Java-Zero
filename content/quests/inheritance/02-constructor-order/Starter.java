class Animal {
    // Добавь конструктор Animal(): он печатает «Отработал конструктор Animal»
}

class Cat extends Animal {
    // Добавь конструктор Cat(): он печатает «Отработал конструктор Cat!»
}

public class Inheritance {
    public static void main(String[] args) {
        new Cat();
        System.out.println("---");
        new Animal();
    }
}
