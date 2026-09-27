import java.util.Map;
import java.util.Scanner;
import java.util.TreeMap;

public class CollectionsLab {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Map<String, Integer> counts = new TreeMap<>();
        while (sc.hasNext()) {
            String word = sc.next().toLowerCase();
            counts.put(word, counts.getOrDefault(word, 0) + 1);
        }
        String top = null;
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            System.out.println(e.getKey() + ": " + e.getValue());
            if (top == null || e.getValue() > counts.get(top)) {
                top = e.getKey();
            }
        }
        System.out.println("Чаще всего: " + top);
    }
}
