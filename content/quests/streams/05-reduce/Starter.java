import java.util.List;
import java.util.stream.IntStream;

public class Streams {
    public static void main(String[] args) {
        List<Integer> scores = List.of(78, 92, 65, 88);
        // Сумма квадратов 1..10 — IntStream.rangeClosed, map, sum
        System.out.println("Сумма квадратов: ?");
        // Средний балл — mapToInt, average, orElse
        // 6! — reduce(1, ...)
        // Лучший балл — mapToInt, max
        // Чётных до 20 — filter и count
    }
}
