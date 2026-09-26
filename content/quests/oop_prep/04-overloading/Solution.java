import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Cat unknown = new Cat();
        Cat barsik = new Cat("Барсик", 3);
        unknown.printInfo();
        barsik.printInfo();

        String first = sc.next();
        String second = sc.next();
        barsik.sayHi(first);
        barsik.sayHi(first, second);
    }
}

class Cat {
    String name;
    int age;

    Cat() {
        this("Безымянный", 1);
    }

    Cat(String name, int age) {
        this.name = name;
        this.age = age;
    }

    void printInfo() {
        System.out.println("Кот: " + name + ", возраст: " + age);
    }

    void sayHi(String guest) {
        System.out.println(name + ": Привет, " + guest + "!");
    }

    void sayHi(String first, String second) {
        System.out.println(name + ": Привет, " + first + " и " + second + "!");
    }
}
