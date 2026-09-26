class Animal {
    String name;
    int age;

    void introduce() {
        System.out.println("Я " + name + ", мне " + age);
    }
}

class Cat extends Animal {
    void meow() {
        System.out.println(name + ": Мяу!");
    }
}

public class Inheritance {
    public static void main(String[] args) {
        Cat cat = new Cat();
        cat.name = "Барсик";
        cat.age = 3;
        cat.introduce();
        cat.meow();
    }
}
