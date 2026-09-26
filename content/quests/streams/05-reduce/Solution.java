import java.util.List;
import java.util.stream.IntStream;

public class Streams {
    public static void main(String[] args) {
        List<Integer> scores = List.of(78, 92, 65, 88);
        int squares = IntStream.rangeClosed(1, 10).map(x -> x * x).sum();
        System.out.println("Сумма квадратов: " + squares);

        double avg = scores.stream().mapToInt(Integer::intValue).average().orElse(0);
        System.out.println("Средний балл: " + avg);

        int factorial = IntStream.rangeClosed(1, 6).reduce(1, (acc, x) -> acc * x);
        System.out.println("6! = " + factorial);

        int best = scores.stream().mapToInt(Integer::intValue).max().orElse(0);
        System.out.println("Лучший балл: " + best);

        long evens = IntStream.rangeClosed(1, 20).filter(x -> x % 2 == 0).count();
        System.out.println("Чётных до 20: " + evens);
    }
}
