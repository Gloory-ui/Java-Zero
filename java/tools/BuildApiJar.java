import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;
import java.util.TreeMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipOutputStream;

/**
 * Собирает java17-api.jar: сигнатуры модуля java.base для Java 17 из lib/ct.sym установленного JDK.
 * В ct.sym каталоги названы набором версий (8, 9, A=10 … H=17 …); берём те, где есть «H».
 *
 * Запуск: java java/tools/BuildApiJar.java <JDK_HOME>/lib/ct.sym public/java/java17-api.jar
 */
public class BuildApiJar {
    private static final char RELEASE = 'H';

    public static void main(String[] args) throws Exception {
        Map<String, String> picked = new TreeMap<>(); // имя класса → запись в ct.sym
        try (ZipFile ct = new ZipFile(args[0])) {
            ct.stream().forEach(e -> {
                String[] parts = e.getName().split("/", 3);
                if (parts.length < 3 || !e.getName().endsWith(".sig")) return;
                if (parts[0].indexOf(RELEASE) < 0 || !parts[1].equals("java.base") || parts[2].startsWith("module-info")) return;
                picked.put(parts[2].substring(0, parts[2].length() - 4) + ".class", e.getName());
            });
            Files.createDirectories(Paths.get(args[1]).toAbsolutePath().getParent());
            try (ZipOutputStream out = new ZipOutputStream(new FileOutputStream(args[1]))) {
                for (Map.Entry<String, String> it : picked.entrySet()) {
                    ZipEntry entry = new ZipEntry(it.getKey());
                    entry.setTime(0); // одинаковые байты при каждой сборке
                    out.putNextEntry(entry);
                    try (var in = ct.getInputStream(ct.getEntry(it.getValue()))) {
                        in.transferTo(out);
                    }
                    out.closeEntry();
                }
            }
        }
        System.out.println("java17-api.jar: " + picked.size() + " classes");
    }
}
