import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

public class Algorithms {
    static int[] a;

    static void swap(int i, int j) {
        int tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }

    // Разбиение Ломуто: опора a[hi], меньшие — влево, опора — на место i + 1
    static int partition(int lo, int hi) {
        int pivot = a[hi];
        System.out.println("Опора " + pivot + ": " + Arrays.toString(a));
        return hi;
    }

    static void quickSort(int lo, int hi) {
        if (lo < hi) {
            int p = partition(lo, hi);
            quickSort(lo, p - 1);
            quickSort(p + 1, hi);
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) {
            list.add(sc.nextInt());
        }
        a = list.stream().mapToInt(Integer::intValue).toArray();
        quickSort(0, a.length - 1);
        System.out.println("Итог: " + Arrays.toString(a));
    }
}
