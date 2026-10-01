class Animal {
    String name;
    int age;

    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

class Cat extends Animal {
    String color;

    public Cat(String name, int age, String color) {
        super(name, age);
        this.color = color;
    }

    void info() {
        System.out.println(name + ", " + age + " г., окрас: " + color);
    }
}

public class Inheritance {
    public static void main(String[] args) {
        Cat murka = new Cat("Мурка", 2, "рыжий");
        Cat snow = new Cat("Снежок", 5, "белый");
        murka.info();
        snow.info();
    }
}
