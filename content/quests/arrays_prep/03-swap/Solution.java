import java.util.Scanner;

public class ArraysPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) {
            a[i] = sc.nextInt();
        }

        int maxIndex = 0;
        for (int i = 1; i < n; i++) {
            if (a[i] > a[maxIndex]) {
                maxIndex = i;
            }
        }
        System.out.println("Индекс максимума: " + maxIndex);

        int temp = a[0];
        a[0] = a[maxIndex];
        a[maxIndex] = temp;

        System.out.print("После обмена: {");
        for (int i = 0; i < n; i++) {
            if (i > 0) {
                System.out.print(", ");
            }
            System.out.print(a[i]);
        }
        System.out.println("}");
    }
}
