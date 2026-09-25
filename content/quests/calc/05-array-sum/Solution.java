import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        double[] results = new double[n];

        for (int i = 0; i < n; i++) {
            results[i] = sc.nextDouble();
        }

        double sum = 0;
        double max = results[0];
        for (int i = 0; i < n; i++) {
            sum += results[i];
            if (results[i] > max) {
                max = results[i];
            }
        }

        System.out.println("Сумма: " + sum);
        System.out.println("Максимум: " + max);
        System.out.println("Среднее: " + sum / n);
    }
}
