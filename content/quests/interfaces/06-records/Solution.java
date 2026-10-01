public class Interfaces {
    record Student(String name, int score) {
        Student {
            if (score > 100) {
                score = 100;
            }
        }

        boolean passed() {
            return score >= 60;
        }
    }

    public static void main(String[] args) {
        Student[] group = { new Student("Аня", 90), new Student("Борис", 55), new Student("Вика", 120) };
        for (Student s : group) {
            System.out.println(s);
        }
        for (Student s : group) {
            System.out.println(s.name() + ": " + (s.passed() ? "зачёт" : "незачёт"));
        }
        System.out.println("Записи равны: " + group[0].equals(new Student("Аня", 90)));
    }
}
