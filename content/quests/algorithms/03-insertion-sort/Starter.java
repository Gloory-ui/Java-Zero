import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;

public class Algorithms {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) {
            list.add(sc.nextInt());
        }
        int[] a = list.stream().mapToInt(Integer::intValue).toArray();
        int shifts = 0;
        // Вставками: для i от 1 сохрани key = a[i], сдвигай большие вправо, вставь key,
        // печатай «Вставлен key: [...]»
        System.out.println("Сдвигов: " + shifts);
    }
}
