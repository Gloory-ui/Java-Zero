import java.util.Scanner;

public class KT2 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[][] m = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                m[i][j] = sc.nextInt();
            }
        }

        int mainSum = 0;
        int sideSum = 0;
        for (int i = 0; i < n; i++) {
            mainSum += m[i][i];
            sideSum += m[i][n - 1 - i];
        }
        System.out.println("Сумма главной диагонали: " + mainSum);
        System.out.println("Сумма побочной диагонали: " + sideSum);
    }
}
