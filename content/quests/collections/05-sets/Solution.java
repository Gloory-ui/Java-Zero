import java.util.Scanner;
import java.util.Set;
import java.util.TreeSet;

public class CollectionsLab {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Set<Integer> unique = new TreeSet<>();
        Set<Integer> repeated = new TreeSet<>();
        int total = 0;
        while (sc.hasNextInt()) {
            int n = sc.nextInt();
            total++;
            if (!unique.add(n)) {
                repeated.add(n);
            }
        }
        System.out.println("Всего чисел: " + total);
        System.out.println("Разных: " + unique.size());
        System.out.println("По возрастанию: " + unique);
        System.out.println("Повторялись: " + repeated);
    }
}
