import java.util.Scanner;

public class ArraysPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) {
            a[i] = sc.nextInt();
        }

        int max = a[0];
        for (int i = 1; i < n; i++) {
            if (a[i] > max) {
                max = a[i];
            }
        }
        System.out.println("Максимум: " + max);

        System.out.print("Индексы:");
        for (int i = 0; i < n; i++) {
            if (a[i] == max) {
                System.out.print(" " + i);
            }
        }
        System.out.println();
    }
}
