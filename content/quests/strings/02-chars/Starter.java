import java.util.Scanner;

public class Strings {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.nextLine();
        int letters = 0, digits = 0, spaces = 0, other = 0, upper = 0;
        // Пройди по символам line и разложи их по группам

        System.out.println("Букв: " + letters);
        System.out.println("Цифр: " + digits);
        System.out.println("Пробелов: " + spaces);
        System.out.println("Других: " + other);
        System.out.println("Заглавных: " + upper);
    }
}
