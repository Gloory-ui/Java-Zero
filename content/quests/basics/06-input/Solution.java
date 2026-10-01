import java.util.Scanner;

public class Basics {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();

        System.out.println("Сумма: " + (a + b));
        System.out.println("Произведение: " + (a * b));
    }
}
