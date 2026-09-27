import java.util.ArrayList;
import java.util.List;

public class Generics {
    static double sumAll(List<? extends Number> list) {
        double sum = 0;
        for (Number n : list) {
            sum += n.doubleValue();
        }
        return sum;
    }

    static void fillSquares(List<? super Integer> out, int n) {
        for (int i = 1; i <= n; i++) {
            out.add(i * i);
        }
    }

    public static void main(String[] args) {
        List<Integer> ints = List.of(1, 2, 3);
        List<Double> doubles = List.of(0.5, 0.25);
        System.out.println(sumAll(ints));
        System.out.println(sumAll(doubles));
        List<Number> numbers = new ArrayList<>();
        fillSquares(numbers, 4);
        System.out.println(numbers);
        List<Object> objects = new ArrayList<>(List.of("старт"));
        fillSquares(objects, 2);
        System.out.println(objects);
    }
}
