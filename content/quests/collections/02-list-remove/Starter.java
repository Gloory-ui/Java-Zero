import java.util.ArrayList;
import java.util.Iterator;
import java.util.Scanner;

public class CollectionsLab {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        ArrayList<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) {
            list.add(sc.nextInt());
        }
        System.out.println("Было: " + list);
        // Удали отрицательные через Iterator и выведи «Без отрицательных: ...»
        // Удали чётные через removeIf и выведи «Только нечётные: ...»
    }
}
