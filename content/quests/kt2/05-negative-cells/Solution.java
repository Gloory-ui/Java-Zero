import java.util.Scanner;

public class KT2 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int rows = sc.nextInt();
        int cols = sc.nextInt();
        int[][] t = new int[rows][cols];
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                t[i][j] = sc.nextInt();
            }
        }

        int count = 0;
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                if (t[i][j] < 0) {
                    System.out.println("[" + i + "][" + j + "]");
                    count++;
                }
            }
        }
        if (count == 0) {
            System.out.println("Отрицательных чисел нет");
        }
    }
}
