import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.Supplier;

public class Streams {
    public static void main(String[] args) {
        List<String> words = List.of("кот", "компьютер", "окно", "клавиатура", "мышь");
        Predicate<String> isLong = s -> false;    // длиннее 4 букв
        Predicate<String> startsK = s -> false;   // начинается на «к»

        List<String> longK = new ArrayList<>();
        List<String> shorts = new ArrayList<>();
        // Разложи слова: длинные на «к» — isLong.and(startsK), короткие — isLong.negate()
        System.out.println("Длинные на «к»: " + longK);
        System.out.println("Короткие: " + shorts);

        // Function<String, Integer> len, Function<String, String> shout и loud = shout.andThen(...)
        // Supplier<String> greeting и Consumer<String> printer
    }
}
