import java.util.Scanner;

public class ArraysPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[][] m = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                m[i][j] = i * n + j + 1;
                System.out.print(m[i][j] + " ");
            }
            System.out.println();
        }

        System.out.print("Главная:");
        for (int i = 0; i < n; i++) {
            System.out.print(" " + m[i][i]);
        }
        System.out.println();

        System.out.print("Побочная:");
        for (int i = 0; i < n; i++) {
            System.out.print(" " + m[i][n - 1 - i]);
        }
        System.out.println();
    }
}
