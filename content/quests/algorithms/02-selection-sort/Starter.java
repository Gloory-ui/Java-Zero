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
        // Сортировка выбором: на шаге i найди индекс минимума в a[i..], обменяй с a[i]
        // и напечатай «Шаг k: минимум X → [...]»
    }
}
