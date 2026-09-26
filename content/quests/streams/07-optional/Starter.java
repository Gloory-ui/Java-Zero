import java.util.Comparator;
import java.util.List;
import java.util.Optional;

public class Streams {
    record Student(String name, int score) { }

    static Optional<Student> findByName(List<Student> students, String name) {
        // Первый студент с таким именем или пустой Optional
        return Optional.empty();
    }

    public static void main(String[] args) {
        List<Student> students = List.of(
            new Student("Борис", 55), new Student("Аня", 90),
            new Student("Вика", 72), new Student("Гоша", 48));
        // Первый с баллом выше 85 — filter, findFirst, map, orElse("никто")
        // То же для балла выше 95
        // Лучший — max(Comparator.comparingInt(Student::score)) и ifPresent
        System.out.println("Балл Гоши: " + findByName(students, "Гоша").map(Student::score).orElse(-1));
        System.out.println("Балл Жени: " + findByName(students, "Женя").map(Student::score).orElse(-1));
    }
}
