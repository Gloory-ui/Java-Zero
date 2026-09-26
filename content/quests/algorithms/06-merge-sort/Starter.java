import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

public class Algorithms {
    static int[] merge(int[] left, int[] right) {
        int[] out = new int[left.length + right.length];
        // Слей две отсортированные половины: сравнивай головы, потом допиши остатки
        System.out.println("Слияние " + Arrays.toString(left) + " + " + Arrays.toString(right) + " → "
            + Arrays.toString(out));
        return out;
    }

    static int[] mergeSort(int[] a) {
        if (a.length <= 1) {
            return a;
        }
        int mid = a.length / 2;
        // Отсортируй половины рекурсивно и слей их
        return a;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) {
            list.add(sc.nextInt());
        }
        int[] a = list.stream().mapToInt(Integer::intValue).toArray();
        System.out.println("Итог: " + Arrays.toString(mergeSort(a)));
    }
}
