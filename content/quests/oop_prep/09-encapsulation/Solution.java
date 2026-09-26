import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Cat barsik = new Cat("Барсик", 3);
        int n = sc.nextInt();
        for (int i = 0; i < n; i++) {
            barsik.setAge(sc.nextInt());
            System.out.println(barsik.getName() + ": " + barsik.getAge());
        }

        barsik.setName("Василий");
        System.out.println("Новое имя: " + barsik.getName());
    }
}

class Cat {
    private String name;
    private int age;

    Cat(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setAge(int age) {
        if (age >= 0) {
            this.age = age;
        } else {
            System.out.println("Ошибка: возраст не может быть отрицательным");
        }
    }
}
