import java.util.Scanner;

public class KT2 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) {
            a[i] = sc.nextInt();
        }

        int min = a[0];
        for (int i = 1; i < n; i++) {
            if (a[i] < min) {
                min = a[i];
            }
        }
        System.out.println("Наименьший элемент: " + min);

        for (int i = 0; i < n; i++) {
            if (a[i] == min) {
                System.out.println("a[" + i + "] = " + a[i]);
            }
        }
    }
}
