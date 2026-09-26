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
            if (cmd.equals("END")) {
                break;
            }
            switch (cmd) {
                case "ADD" -> value += Integer.parseInt(parts[1]);
                case "SUB" -> value -= Integer.parseInt(parts[1]);
                case "MUL" -> value *= Integer.parseInt(parts[1]);
                case "DIV" -> value /= Integer.parseInt(parts[1]);
                case "PRINT" -> System.out.println("Значение: " + value);
                default -> System.out.println("Неизвестная команда: " + cmd);
            }
        }
        System.out.println("Итог: " + value);
    }
}
