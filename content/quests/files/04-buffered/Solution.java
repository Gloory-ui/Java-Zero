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
        try (BufferedWriter out = Files.newBufferedWriter(file)) {
            for (int i = 1; i <= n; i++) {
                out.write(String.valueOf(i * i));
                out.newLine();
            }
        }
        System.out.println("Записано строк: " + n);

        int sum = 0;
        String last = "";
        try (BufferedReader in = Files.newBufferedReader(file)) {
            String line;
            while ((line = in.readLine()) != null) {
                sum += Integer.parseInt(line);
                last = line;
            }
        }
        System.out.println("Сумма: " + sum);
        System.out.println("Последняя строка: " + last);
    }
}
