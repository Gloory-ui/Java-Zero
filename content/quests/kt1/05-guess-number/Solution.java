import java.util.Scanner;

public class KT1 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int target = 42;
        int maxAttempts = 5;
        int attempts = 0;

        while (attempts < maxAttempts) {
            attempts++;
            int guess = sc.nextInt();

            if (guess == target) {
                System.out.println("Угадал!");
                break;
            } else if (guess < target) {
                System.out.println("больше");
            } else {
                System.out.println("меньше");
            }
        }
    }
}
