import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        Cat[] cats = new Cat[n];
        for (int i = 0; i < n; i++) {
            cats[i] = new Cat(sc.next(), sc.nextInt());
        }

        for (int i = 0; i < n; i++) {
            cats[i].printCard(i + 1);
        }

        int oldest = 0;
        for (int i = 1; i < n; i++) {
            if (cats[i].age > cats[oldest].age) {
                oldest = i;
            }
        }
        System.out.println("Самый старший: " + cats[oldest].name);
    }
}

class Cat {
    String name;
    int age;

    Cat(String name, int age) {
        this.name = name;
        this.age = age;
    }

    void printCard(int number) {
        System.out.println("--- Карточка " + number + " ---");
        System.out.println("Имя: " + name);
        System.out.println("Возраст: " + age);
    }
}
