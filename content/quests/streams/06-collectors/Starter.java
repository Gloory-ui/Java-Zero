import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class Streams {
    record Student(String name, String group, int score) { }

    public static void main(String[] args) {
        List<Student> students = List.of(
            new Student("Аня", "ИТ-1", 90),
            new Student("Борис", "ИТ-2", 55),
            new Student("Вика", "ИТ-1", 72),
            new Student("Гоша", "ИТ-1", 48),
            new Student("Даша", "ИТ-2", 81));
        // Имена через joining, группы через groupingBy с TreeMap::new и counting,
        // средний балл через averagingInt, сдали — partitioningBy с mapping
        System.out.println("Все: ?");
    }
}
