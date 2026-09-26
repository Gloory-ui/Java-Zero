import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int year = sc.nextInt();
        Cat barsik = new Cat("Барсик", sc.nextInt());
        TimeMachine machine = new TimeMachine();

        System.out.println("Год до поездки: " + year);
        machine.goToFuture(year);
        System.out.println("Год после поездки: " + year);

        System.out.println("Возраст Барсика до поездки: " + barsik.age);
        machine.goToFuture(barsik);
        System.out.println("Возраст Барсика после поездки: " + barsik.age);
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

class TimeMachine {
    void goToFuture(int year) {
        year = year + 10;
    }

    void goToFuture(Cat cat) {
        cat.age = cat.age + 10;
    }
}
