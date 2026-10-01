import java.util.ArrayList;
import java.util.List;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.function.Supplier;

public class Streams {
    public static void main(String[] args) {
        List<String> raw = new ArrayList<>(List.of(" 42", "7 ", " 15 "));
        // raw.replaceAll(...) — обрежь пробелы ссылкой на метод
        System.out.println(raw);

        // Function<String, Integer> parse = ...; переведи raw в список чисел nums
        List<Integer> nums = new ArrayList<>();
        // nums.forEach(...) — напечатай каждое число ссылкой на метод

        // BiFunction<Integer, Integer, Integer> max = ...; найди максимум
        // Supplier<List<String>> maker = ...; «Новый список: » + maker.get()
    }
}
