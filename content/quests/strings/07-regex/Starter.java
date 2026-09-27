import java.util.Scanner;

public class Strings {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int ok = 0, total = 0;
        while (sc.hasNext()) {
            String login = sc.next();
            total++;
            // Проверь логин через matches: строчная латинская буква, потом 2–15 букв, цифр или _
            System.out.println(login + ": ?");
        }
        System.out.println("Подходит: " + ok + " из " + total);
    }
}
