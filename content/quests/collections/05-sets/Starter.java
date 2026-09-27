import java.util.Scanner;
import java.util.Set;
import java.util.TreeSet;

public class CollectionsLab {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Set<Integer> unique = new TreeSet<>();
        int total = 0;
        while (sc.hasNextInt()) {
            int n = sc.nextInt();
            total++;
            // Добавь n в unique; если add вернул false — это повтор
        }
        System.out.println("Всего чисел: " + total);
        // Разных, по возрастанию, повторялись
    }
}
