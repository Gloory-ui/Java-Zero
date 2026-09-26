import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class FileLab {
    public static void main(String[] args) throws IOException {
        Scanner sc = new Scanner(System.in);
        List<String> input = new ArrayList<>();
        while (sc.hasNextLine()) {
            input.add(sc.nextLine());
        }
        Path file = Path.of("todo.txt");
        Files.write(file, input);

        List<String> lines = Files.readAllLines(file);
        String longest = "";
        for (int i = 0; i < lines.size(); i++) {
            System.out.println((i + 1) + ". " + lines.get(i));
            if (lines.get(i).length() > longest.length()) {
                longest = lines.get(i);
            }
        }
        System.out.println("Строк: " + lines.size());
        System.out.println("Самая длинная: " + longest);
    }
}
