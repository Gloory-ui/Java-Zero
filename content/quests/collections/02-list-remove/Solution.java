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

        Iterator<Integer> it = list.iterator();
        while (it.hasNext()) {
            int n = it.next();
            if (n < 0) {
                it.remove();
            }
        }
        System.out.println("Без отрицательных: " + list);

        list.removeIf(n -> n % 2 == 0);
        System.out.println("Только нечётные: " + list);
    }
}
