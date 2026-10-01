import java.util.Scanner;

public class Strings {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.nextLine();
        int letters = 0, digits = 0, spaces = 0, other = 0, upper = 0;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (Character.isLetter(c)) {
                letters++;
            } else if (Character.isDigit(c)) {
                digits++;
            } else if (Character.isWhitespace(c)) {
                spaces++;
            } else {
                other++;
            }
            if (Character.isUpperCase(c)) {
                upper++;
            }
        }
        System.out.println("Букв: " + letters);
        System.out.println("Цифр: " + digits);
        System.out.println("Пробелов: " + spaces);
        System.out.println("Других: " + other);
        System.out.println("Заглавных: " + upper);
    }
}
