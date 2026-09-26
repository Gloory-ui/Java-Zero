import java.util.Scanner;

public class Algorithms {
    static int steps;

    // Верни индекс target в a или -1; считай проверки середины в steps
    static int search(int[] a, int target) {
        steps = 0;
        for (int i = 0; i < a.length; i++) {
            steps++;
            if (a[i] == target) {
                return i;
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] a = { 3, 8, 15, 23, 42, 57, 61, 78, 90, 104 };
        Scanner sc = new Scanner(System.in);
        while (sc.hasNextInt()) {
            int target = sc.nextInt();
            int index = search(a, target);
            if (index >= 0) {
                System.out.println(target + ": индекс " + index + ", шагов " + steps);
            } else {
                System.out.println(target + ": не найден, шагов " + steps);
            }
        }
    }
}
