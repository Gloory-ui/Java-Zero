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
        // Компаратор: по убыванию баллов, при равенстве — по имени
        // Тройка лучших — sorted и limit(3), печать «1. Имя — балл»
        // Разные баллы — map, distinct, sorted(Comparator.reverseOrder())
        // Остальные — sorted, skip(3), map(Result::name)
        System.out.println(results);
    }
}
