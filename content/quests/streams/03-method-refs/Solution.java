import java.util.ArrayList;
import java.util.List;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.function.Supplier;

public class Streams {
    public static void main(String[] args) {
        List<String> raw = new ArrayList<>(List.of(" 42", "7 ", " 15 "));
        raw.replaceAll(String::trim);
        System.out.println(raw);

        Function<String, Integer> parse = Integer::parseInt;
        List<Integer> nums = new ArrayList<>();
        for (String s : raw) {
            nums.add(parse.apply(s));
        }
        nums.forEach(System.out::println);

        BiFunction<Integer, Integer, Integer> max = Math::max;
        int best = nums.get(0);
        for (int n : nums) {
            best = max.apply(best, n);
        }
        System.out.println("Максимум: " + best);

        Supplier<List<String>> maker = ArrayList::new;
        System.out.println("Новый список: " + maker.get());
    }
}
