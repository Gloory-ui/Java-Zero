import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class FileLab {
    public static void main(String[] args) throws IOException {
        Path dir = Path.of("lab12");
        Path file = dir.resolve("hello.txt");
        // Создай папку, удали файл, если он есть, и проверь, есть ли он
        // Запиши «Привет, файл!», проверь снова, выведи имя, папку и размер
        System.out.println("Есть до записи: " + Files.exists(file));
    }
}
