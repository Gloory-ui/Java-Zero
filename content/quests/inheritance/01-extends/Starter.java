class Animal {
    String name;
    int age;

    void introduce() {
        System.out.println("Я " + name + ", мне " + age);
    }
}

// Сделай Cat наследником Animal и добавь метод meow()
class Cat {
}

public class Inheritance {
    public static void main(String[] args) {
        Cat cat = new Cat();
        // Задай имя «Барсик» и возраст 3, вызови introduce() и meow()
    }
}
