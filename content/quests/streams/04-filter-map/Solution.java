import java.util.List;

public class Streams {
    public static void main(String[] args) {
        List<String> words = List.of("поле", "дом", "парус", "кит", "перо", "облако", "пан");
        List<String> big = words.stream()
            .filter(w -> w.length() > 3)
            .map(String::toUpperCase)
            .sorted()
            .toList();
        System.out.println(big);

        long onP = words.stream().filter(w -> w.startsWith("п")).count();
        System.out.println("На «п»: " + onP);

        List<Integer> lengths = words.stream().map(String::length).toList();
        System.out.println("Длины: " + lengths);
    }
}
