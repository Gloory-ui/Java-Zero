import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Cat first = new Cat(sc.next(), sc.nextInt());
        Cat second = new Cat(sc.next(), sc.nextInt());

        first.printInfo();
        second.printInfo();
    }
}

class Cat {
    String name;
    int age;

    Cat(String name, int age) {
        this.name = name;
        this.age = age;
    }

    void printInfo() {
        System.out.println("Кот: " + name + ", возраст: " + age);
    }
}
