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
        int swaps = 0;
        // Пузырёк: проходы, обмен соседей, печать «Проход k: [...]», выход без обменов
        System.out.println("Обменов: " + swaps);
    }
}
