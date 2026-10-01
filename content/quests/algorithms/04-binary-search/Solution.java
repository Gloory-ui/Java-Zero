import java.util.Scanner;

public class Algorithms {
    static int steps;

    static int search(int[] a, int target) {
        steps = 0;
        int lo = 0, hi = a.length - 1;
        while (lo <= hi) {
            steps++;
            int mid = lo + (hi - lo) / 2;
            if (a[mid] == target) {
                return mid;
            } else if (a[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid - 1;
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
