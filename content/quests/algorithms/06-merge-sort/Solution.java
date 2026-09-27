import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

public class Algorithms {
    static int[] merge(int[] left, int[] right) {
        int[] out = new int[left.length + right.length];
        int i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) {
            if (left[i] <= right[j]) {
                out[k++] = left[i++];
            } else {
                out[k++] = right[j++];
            }
        }
        while (i < left.length) {
            out[k++] = left[i++];
        }
        while (j < right.length) {
            out[k++] = right[j++];
        }
        System.out.println("Слияние " + Arrays.toString(left) + " + " + Arrays.toString(right) + " → "
            + Arrays.toString(out));
        return out;
    }

    static int[] mergeSort(int[] a) {
        if (a.length <= 1) {
            return a;
        }
        int mid = a.length / 2;
        int[] left = mergeSort(Arrays.copyOfRange(a, 0, mid));
        int[] right = mergeSort(Arrays.copyOfRange(a, mid, a.length));
        return merge(left, right);
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
