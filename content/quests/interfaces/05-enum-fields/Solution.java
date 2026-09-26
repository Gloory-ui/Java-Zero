import java.util.Scanner;

enum Size {
    SMALL("Маленький", 150),
    MEDIUM("Средний", 200),
    LARGE("Большой", 250);

    private final String label;
    private final int price;

    Size(String label, int price) {
        this.label = label;
        this.price = price;
    }

    String label() {
        return label;
    }

    int price() {
        return price;
    }
}

public class Interfaces {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int total = 0;
        while (sc.hasNext()) {
            Size size = Size.valueOf(sc.next());
            System.out.println(size.label() + ": " + size.price());
            total += size.price();
        }
        System.out.println("Итого: " + total);
    }
}
