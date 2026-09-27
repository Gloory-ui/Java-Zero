import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class FileLab {
    public static void main(String[] args) throws IOException {
        Path dir = Path.of("lab12");
        Path file = dir.resolve("hello.txt");
        Files.createDirectories(dir);
        Files.deleteIfExists(file);
        System.out.println("Есть до записи: " + Files.exists(file));
        Files.writeString(file, "Привет, файл!");
        System.out.println("Есть после записи: " + Files.exists(file));
        System.out.println("Имя: " + file.getFileName());
        System.out.println("Папка: " + file.getParent());
        System.out.println("Размер в байтах: " + Files.size(file));
    }
}
