import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.Supplier;

public class Streams {
    public static void main(String[] args) {
        List<String> words = List.of("кот", "компьютер", "окно", "клавиатура", "мышь");
        Predicate<String> isLong = s -> s.length() > 4;
        Predicate<String> startsK = s -> s.startsWith("к");

        List<String> longK = new ArrayList<>();
        List<String> shorts = new ArrayList<>();
        for (String w : words) {
            if (isLong.and(startsK).test(w)) {
                longK.add(w);
            }
            if (isLong.negate().test(w)) {
                shorts.add(w);
            }
        }
        System.out.println("Длинные на «к»: " + longK);
        System.out.println("Короткие: " + shorts);

        Function<String, Integer> len = s -> s.length();
        System.out.println("Длина «клавиатура»: " + len.apply("клавиатура"));

        Function<String, String> shout = s -> s.toUpperCase();
        Function<String, String> loud = shout.andThen(s -> s + "!");
        System.out.println("Крик: " + loud.apply("кот"));

        Supplier<String> greeting = () -> "Привет, Java!";
        Consumer<String> printer = s -> System.out.println("Приветствие: " + s);
        printer.accept(greeting.get());
    }
}
