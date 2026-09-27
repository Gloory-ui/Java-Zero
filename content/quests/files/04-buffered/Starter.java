import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Scanner;

public class FileLab {
    public static void main(String[] args) throws IOException {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        Path file = Path.of("squares.txt");
        // Запиши квадраты 1..n через BufferedWriter в try-with-resources
        System.out.println("Записано строк: " + n);
        // Прочитай через BufferedReader: сумма и последняя строка
    }
}
