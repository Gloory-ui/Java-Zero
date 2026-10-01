import java.util.Scanner;

public class KT2 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] days = {"Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"};

        int[][] visits = new int[7][4];
        for (int i = 0; i < visits.length; i++) {
            for (int j = 0; j < visits[i].length; j++) {
                visits[i][j] = sc.nextInt();
            }
        }

        int[] sums = new int[visits.length];
        for (int i = 0; i < visits.length; i++) {
            int sum = 0;
            for (int j = 0; j < visits[i].length; j++) {
                sum += visits[i][j];
            }
            sums[i] = sum;
            System.out.println(days[i] + ": " + sum);
        }

        int maxDay = 0;
        int minDay = 0;
        for (int i = 1; i < sums.length; i++) {
            if (sums[i] > sums[maxDay]) {
                maxDay = i;
            }
            if (sums[i] < sums[minDay]) {
                minDay = i;
            }
        }
        System.out.println("Самый загруженный день: " + days[maxDay] + " (" + sums[maxDay] + ")");
        System.out.println("Самый свободный день: " + days[minDay] + " (" + sums[minDay] + ")");
    }
}
