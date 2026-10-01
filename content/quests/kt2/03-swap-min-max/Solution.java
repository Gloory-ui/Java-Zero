import java.util.Scanner;

public class KT2 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) {
            a[i] = sc.nextInt();
        }

        System.out.print("До: {");
        for (int i = 0; i < n; i++) {
            if (i > 0) {
                System.out.print(", ");
            }
            System.out.print(a[i]);
        }
        System.out.println("}");

        int maxIndex = 0;
        int minIndex = 0;
        for (int i = 1; i < n; i++) {
            if (a[i] > a[maxIndex]) {
                maxIndex = i;
            }
            if (a[i] < a[minIndex]) {
                minIndex = i;
            }
        }

        int temp = a[maxIndex];
        a[maxIndex] = a[minIndex];
        a[minIndex] = temp;

        System.out.print("После: {");
        for (int i = 0; i < n; i++) {
            if (i > 0) {
                System.out.print(", ");
            }
            System.out.print(a[i]);
        }
        System.out.println("}");
    }
}
