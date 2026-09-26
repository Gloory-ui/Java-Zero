import java.util.List;

public class Streams {
    public static void main(String[] args) {
        List<String> words = List.of("поле", "дом", "парус", "кит", "перо", "облако", "пан");
        // Длиннее 3 букв, заглавными, по алфавиту — filter, map, sorted, toList
        List<String> big = words;
        System.out.println(big);
        // На «п» — filter и count
        // Длины — map(String::length) и toList
    }
}
