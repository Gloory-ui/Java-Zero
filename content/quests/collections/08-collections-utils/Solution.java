import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class CollectionsLab {
    public static void main(String[] args) {
        List<Integer> marks = new ArrayList<>(List.of(7, 3, 9, 3, 5, 3));
        System.out.println("Максимум: " + Collections.max(marks));
        System.out.println("Минимум: " + Collections.min(marks));
        System.out.println("Троек: " + Collections.frequency(marks, 3));
        Collections.sort(marks);
        System.out.println("По возрастанию: " + marks);
        Collections.reverse(marks);
        System.out.println("По убыванию: " + marks);

        List<Integer> fixed = List.of(1, 2);
        try {
            fixed.add(3);
        } catch (UnsupportedOperationException e) {
            System.out.println("List.of менять нельзя: " + e.getClass().getSimpleName());
        }
    }
}
