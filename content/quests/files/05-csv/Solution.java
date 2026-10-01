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
        List<String> lines = Files.readAllLines(csv);
        double total = 0;
        for (int i = 1; i < lines.size(); i++) {
            String[] cells = lines.get(i).split(";");
            double sum = Integer.parseInt(cells[1]) * Double.parseDouble(cells[2]);
            total += sum;
            report.add(cells[0] + ": " + String.format("%.2f", sum));
        }
        report.add("Итого: " + String.format("%.2f", total));

        Path out = Path.of("report.txt");
        Files.write(out, report);
        for (String line : Files.readAllLines(out)) {
            System.out.println(line);
        }
    }
}
