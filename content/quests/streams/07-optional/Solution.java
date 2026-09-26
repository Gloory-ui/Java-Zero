import java.util.Comparator;
import java.util.List;
import java.util.Optional;

public class Streams {
    record Student(String name, int score) { }

    static Optional<Student> findByName(List<Student> students, String name) {
        return students.stream().filter(s -> s.name().equals(name)).findFirst();
    }

    public static void main(String[] args) {
        List<Student> students = List.of(
            new Student("Борис", 55), new Student("Аня", 90),
            new Student("Вика", 72), new Student("Гоша", 48));

        String first = students.stream()
            .filter(s -> s.score() > 85)
            .findFirst()
            .map(Student::name)
            .orElse("никто");
        System.out.println("Первый отличник: " + first);

        String top = students.stream()
            .filter(s -> s.score() > 95)
            .findFirst()
            .map(Student::name)
            .orElse("никто");
        System.out.println("Выше 95: " + top);

        students.stream()
            .max(Comparator.comparingInt(Student::score))
            .ifPresent(s -> System.out.println("Лучший: " + s.name() + " (" + s.score() + ")"));

        System.out.println("Балл Гоши: " + findByName(students, "Гоша").map(Student::score).orElse(-1));
        System.out.println("Балл Жени: " + findByName(students, "Женя").map(Student::score).orElse(-1));
    }
}
