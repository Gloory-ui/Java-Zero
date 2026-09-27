import java.util.Scanner;

public class Exceptions {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        while (sc.hasNextInt()) {
            int a = sc.nextInt();
            int b = sc.nextInt();
            // Оберни деление в try/catch: при делителе 0 — «a / b: деление на ноль»
            System.out.println(a + " / " + b + " = " + a / b);
        }
        System.out.println("Готово");
    }
}
