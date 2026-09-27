import java.util.Scanner;

public class Strings {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.nextLine();
        String[] names = line.split(";");
        // Обрежь пробелы у каждого имени, выведи количество,
        // список через ", " и самое длинное имя
        System.out.println("Имён: " + names.length);
    }
}
