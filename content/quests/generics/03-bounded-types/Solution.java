import java.util.List;

public class Generics {
    static <T extends Comparable<T>> T maxOf(List<T> list) {
        T best = list.get(0);
        for (T item : list) {
            if (item.compareTo(best) > 0) {
                best = item;
            }
        }
        return best;
    }

    static <T extends Number> double average(List<T> list) {
        double sum = 0;
        for (T x : list) {
            sum += x.doubleValue();
        }
        return sum / list.size();
    }

    public static void main(String[] args) {
        System.out.println(maxOf(List.of(3, 9, 4)));
        System.out.println(maxOf(List.of("груша", "яблоко", "апельсин")));
        System.out.println(average(List.of(2, 3, 7)));
        System.out.println(average(List.of(1.5, 2.5)));
    }
}
