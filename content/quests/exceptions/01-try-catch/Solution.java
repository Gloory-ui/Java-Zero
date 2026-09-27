import java.util.Scanner;

public class Exceptions {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        while (sc.hasNextInt()) {
            int a = sc.nextInt();
            int b = sc.nextInt();
            try {
                int q = a / b;
                System.out.println(a + " / " + b + " = " + q);
            } catch (ArithmeticException e) {
                System.out.println(a + " / " + b + ": деление на ноль");
            }
        }
        System.out.println("Готово");
    }
}
