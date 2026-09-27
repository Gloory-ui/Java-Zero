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
            // Прочитай dir.resolve(name) через Files.readString, поймай NoSuchFileException
            System.out.println(name + ": " + Files.readString(dir.resolve(name)));
        }
        // Удали a.txt, b.txt и c.txt через deleteIfExists и посчитай удаления
    }
}
