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
            List<String> current = new ArrayList<>(Files.readAllLines(diary));
            current.add(count + ") " + entry);
            Files.write(diary, current);
        }
        List<String> lines = Files.readAllLines(diary);
        for (String line : lines) {
            System.out.println(line);
        }
        System.out.println("Записей: " + (lines.size() - 1));
    }
}
