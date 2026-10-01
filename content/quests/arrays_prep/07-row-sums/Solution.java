import java.util.Scanner;

public class ArraysPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] shifts = {"Утро", "День", "Вечер"};
        int[][] t = new int[3][4];
        for (int i = 0; i < t.length; i++) {
            for (int j = 0; j < t[i].length; j++) {
                t[i][j] = sc.nextInt();
            }
        }

        int[] sums = new int[t.length];
        for (int i = 0; i < t.length; i++) {
            int sum = 0;
            for (int j = 0; j < t[i].length; j++) {
                sum += t[i][j];
            }
            sums[i] = sum;
            System.out.println(shifts[i] + ": " + sum);
        }

        int maxRow = 0;
        int minRow = 0;
        for (int i = 1; i < sums.length; i++) {
            if (sums[i] > sums[maxRow]) {
                maxRow = i;
            }
            if (sums[i] < sums[minRow]) {
                minRow = i;
            }
        }
        System.out.println("Больше всего заказов: " + shifts[maxRow]);
        System.out.println("Меньше всего заказов: " + shifts[minRow]);
    }
}
