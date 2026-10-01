import java.util.Scanner;

public class Basics {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        if (n > 0) {
            System.out.println("Положительное");
        } else if (n < 0) {
            System.out.println("Отрицательное");
        } else {
            System.out.println("Ноль");
        }

        if (n % 2 == 0) {
            System.out.println("Четное");
        } else {
            System.out.println("Нечетное");
        }
    }
}
