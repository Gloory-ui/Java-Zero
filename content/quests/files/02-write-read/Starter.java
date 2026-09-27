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
        // Запиши input в файл через Files.write, прочитай обратно через Files.readAllLines,
        // выведи пункты с номерами, число строк и самую длинную
    }
}
