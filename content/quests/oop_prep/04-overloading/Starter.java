import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // 1. Создай кота без параметров и Барсика трёх лет, выведи обоих через printInfo()
        // 2. Прочитай двух гостей: sc.next() и sc.next()
        // 3. Барсик здоровается с первым гостем, потом с обоими

    }
}

class Cat {
    String name;
    int age;

    // Добавь конструктор по умолчанию: имя "Безымянный", возраст 1

    Cat(String name, int age) {
        this.name = name;
        this.age = age;
    }

    void printInfo() {
        System.out.println("Кот: " + name + ", возраст: " + age);
    }

    // Добавь sayHi(String guest) и sayHi(String first, String second)
}
