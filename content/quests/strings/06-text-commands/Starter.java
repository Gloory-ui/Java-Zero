import java.util.Scanner;

public class Strings {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int value = 0;
        while (sc.hasNextLine()) {
            String line = sc.nextLine().trim();
            if (line.isEmpty()) {
                continue;
            }
            String[] parts = line.split("\\s+");
            String cmd = parts[0].toUpperCase();
            // END — выход из цикла; ADD, SUB, MUL, DIV — число из parts[1];
            // PRINT — «Значение: ...»; остальное — «Неизвестная команда: ...»
        }
        System.out.println("Итог: " + value);
    }
}
