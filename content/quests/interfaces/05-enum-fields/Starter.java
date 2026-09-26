import java.util.Scanner;

enum Size {
    SMALL, MEDIUM, LARGE
    // Добавь поля label и price и конструктор Size(String label, int price)
}

public class Interfaces {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int total = 0;
        while (sc.hasNext()) {
            Size size = Size.valueOf(sc.next());
            // Печатай «Подпись: цена» и копи итог
            System.out.println(size + ": ?");
        }
        System.out.println("Итого: " + total);
    }
}
