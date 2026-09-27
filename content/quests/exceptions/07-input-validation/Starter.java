import java.util.Scanner;

public class Exceptions {
    static int parseAge(String s) {
        // Разбери s и брось IllegalArgumentException «Возраст должен быть от 0 до 120: N» вне диапазона
        return Integer.parseInt(s);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int age = -1;
        // Читай слова, пока возраст не принят: не число — «Это не число: слово»,
        // вне диапазона — сообщение исключения
        if (age >= 0) {
            System.out.println("Возраст принят: " + age);
        } else {
            System.out.println("Возраст не введён");
        }
    }
}
