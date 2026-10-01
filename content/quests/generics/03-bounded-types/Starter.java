import java.util.List;

public class Generics {
    // Добавь ограничение: T должен быть сравнимым сам с собой
    static <T> T maxOf(List<T> list) {
        T best = list.get(0);
        // Найди наибольший через compareTo
        return best;
    }

    static <T extends Number> double average(List<T> list) {
        // Среднее через doubleValue()
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(maxOf(List.of(3, 9, 4)));
        System.out.println(maxOf(List.of("груша", "яблоко", "апельсин")));
        System.out.println(average(List.of(2, 3, 7)));
        System.out.println(average(List.of(1.5, 2.5)));
    }
}
