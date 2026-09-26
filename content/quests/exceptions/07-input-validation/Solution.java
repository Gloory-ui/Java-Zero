import java.util.Scanner;

public class Exceptions {
    static int parseAge(String s) {
        int age = Integer.parseInt(s);
        if (age < 0 || age > 120) {
            throw new IllegalArgumentException("Возраст должен быть от 0 до 120: " + age);
        }
        return age;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int age = -1;
        while (sc.hasNext()) {
            String word = sc.next();
            try {
                age = parseAge(word);
                break;
            } catch (NumberFormatException e) {
                System.out.println("Это не число: " + word);
            } catch (IllegalArgumentException e) {
                System.out.println(e.getMessage());
            }
        }
        if (age >= 0) {
            System.out.println("Возраст принят: " + age);
        } else {
            System.out.println("Возраст не введён");
        }
    }
}
