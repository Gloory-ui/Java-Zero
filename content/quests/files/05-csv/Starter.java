import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class FileLab {
    public static void main(String[] args) throws IOException {
        Path csv = Path.of("sales.csv");
        Files.write(csv, List.of(
            "товар;количество;цена",
            "Хлеб;2;45.5",
            "Молоко;1;89.9",
            "Сыр;3;120"));

        List<String> report = new ArrayList<>();
        // Прочитай csv, пропусти заголовок, посчитай суммы и итог,
        // собери строки «Товар: 91.00» и «Итого: ...» через String.format("%.2f", ...)
        Path out = Path.of("report.txt");
        Files.write(out, report);
        for (String line : Files.readAllLines(out)) {
            System.out.println(line);
        }
    }
}
