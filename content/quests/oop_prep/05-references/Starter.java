import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int year = sc.nextInt();
        Cat barsik = new Cat("Барсик", sc.nextInt());
        // 1. Создай машину времени: TimeMachine machine = new TimeMachine();
        // 2. Выведи год, вызови machine.goToFuture(year), выведи год снова
        // 3. Выведи возраст Барсика, вызови machine.goToFuture(barsik), выведи возраст снова

    }
}

class Cat {
    String name;
    int age;

    Cat(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

// Опиши класс TimeMachine с методами goToFuture(int year) и goToFuture(Cat cat)
