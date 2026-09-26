import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Scanner;

public class Streams {
    record Result(String name, int score) { }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Result> results = new ArrayList<>();
        while (sc.hasNext()) {
            results.add(new Result(sc.next(), sc.nextInt()));
        }
        Comparator<Result> order = Comparator.comparingInt(Result::score).reversed()
            .thenComparing(Result::name);

        List<Result> top = results.stream().sorted(order).limit(3).toList();
        for (int i = 0; i < top.size(); i++) {
            System.out.println((i + 1) + ". " + top.get(i).name() + " — " + top.get(i).score());
        }

        List<Integer> scores = results.stream()
            .map(Result::score)
            .distinct()
            .sorted(Comparator.reverseOrder())
            .toList();
        System.out.println("Разные баллы: " + scores);

        List<String> rest = results.stream().sorted(order).skip(3).map(Result::name).toList();
        System.out.println("Остальные: " + rest);
    }
}
