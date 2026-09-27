import java.util.ArrayDeque;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Scanner;
import java.util.Set;
import java.util.TreeMap;

public class CollectionsLab {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Set<String> firstVisits = new LinkedHashSet<>();
        Map<String, Integer> visits = new TreeMap<>();
        ArrayDeque<String> lastThree = new ArrayDeque<>();
        while (sc.hasNext()) {
            String name = sc.next();
            firstVisits.add(name);
            visits.put(name, visits.getOrDefault(name, 0) + 1);
            lastThree.offerLast(name);
            if (lastThree.size() > 3) {
                lastThree.pollFirst();
            }
        }
        System.out.println("Первые визиты: " + firstVisits);
        System.out.println("Визитов: " + visits);
        System.out.println("Последние трое: " + lastThree);
    }
}
