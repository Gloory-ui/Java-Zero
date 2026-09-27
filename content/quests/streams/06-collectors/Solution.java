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

        String all = students.stream().map(Student::name).collect(Collectors.joining(", "));
        System.out.println("Все: " + all);

        Map<String, Long> counts = students.stream()
            .collect(Collectors.groupingBy(Student::group, TreeMap::new, Collectors.counting()));
        System.out.println("По группам: " + counts);

        Map<String, Double> averages = students.stream()
            .collect(Collectors.groupingBy(Student::group, TreeMap::new, Collectors.averagingInt(Student::score)));
        System.out.println("Средний балл: " + averages);

        Map<Boolean, List<String>> passed = students.stream()
            .collect(Collectors.partitioningBy(s -> s.score() >= 60,
                Collectors.mapping(Student::name, Collectors.toList())));
        System.out.println("Сдали: " + passed);
    }
}
