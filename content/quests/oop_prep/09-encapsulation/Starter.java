import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Cat barsik = new Cat("Барсик", 3);
        int n = sc.nextInt();
        // 1. В цикле n раз: barsik.setAge(sc.nextInt()); и вывод имени и возраста через геттеры
        // 2. Переименуй кота: barsik.setName("Василий"); и выведи "Новое имя: " + barsik.getName()

    }
}

class Cat {
    // Сделай поля private
    String name;
    int age;

    Cat(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // Добавь геттеры getName(), getAge() и сеттеры setName(...), setAge(...) с проверкой
}
