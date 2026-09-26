import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // 1. Создай массив Cat[] cats = new Cat[n]; и заполни его котами из ввода
        // 2. Выведи карточку каждого: cats[i].printCard(i + 1);
        // 3. Найди самого старшего и выведи "Самый старший: " + имя

    }
}

class Cat {
    String name;
    int age;

    Cat(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // Добавь метод printCard(int number): "--- Карточка 1 ---", "Имя: ...", "Возраст: ..."
}
