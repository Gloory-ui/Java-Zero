import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.List;
import java.util.Scanner;

public class FileLab {
    public static void main(String[] args) throws IOException {
        Scanner sc = new Scanner(System.in);
        Path diary = Path.of("diary.txt");
        Files.writeString(diary, "=== Дневник ===\n");
        int count = 0;
        while (sc.hasNextLine()) {
            String entry = sc.nextLine();
            count++;
            // Допиши «count) entry» в конец файла
        }
        // Прочитай файл, выведи все строки и «Записей: ...»
    }
}
