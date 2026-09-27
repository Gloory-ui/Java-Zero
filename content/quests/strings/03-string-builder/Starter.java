import java.util.Scanner;

public class Strings {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String word = sc.next();
        // Наоборот — через StringBuilder и reverse()
        // Через дефис — append в цикле, без дефиса в конце
        // Палиндром — сравни слово и перевёрнутое без учёта регистра
        System.out.println("Наоборот: " + word);
    }
}
