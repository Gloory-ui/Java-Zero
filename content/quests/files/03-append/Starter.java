import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class FileLab {
    public static void main(String[] args) throws IOException {
        Scanner sc = new Scanner(System.in);
        Path diary = Path.of("diary.txt");
        Files.write(diary, List.of("=== Дневник ==="));
        int count = 0;
        while (sc.hasNextLine()) {
            String entry = sc.nextLine();
            count++;
            // Допиши «count) entry» в конец: прочитай файл, добавь строку, запиши обратно
        }
        // Прочитай файл, выведи все строки и «Записей: ...»
    }
}
