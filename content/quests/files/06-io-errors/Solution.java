import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.util.Scanner;

public class FileLab {
    public static void main(String[] args) throws IOException {
        Path dir = Path.of("lab12err");
        Files.createDirectories(dir);
        Files.writeString(dir.resolve("a.txt"), "альфа");
        Files.writeString(dir.resolve("b.txt"), "бета");

        Scanner sc = new Scanner(System.in);
        while (sc.hasNext()) {
            String name = sc.next();
            try {
                System.out.println(name + ": " + Files.readString(dir.resolve(name)));
            } catch (NoSuchFileException e) {
                System.out.println("Нет файла: " + name);
            }
        }

        int deleted = 0;
        for (String name : new String[] { "a.txt", "b.txt", "c.txt" }) {
            if (Files.deleteIfExists(dir.resolve(name))) {
                deleted++;
            }
        }
        System.out.println("Удалено файлов: " + deleted);
    }
}
