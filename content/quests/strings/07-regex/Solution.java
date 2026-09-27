import java.util.Scanner;

public class Strings {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int ok = 0, total = 0;
        while (sc.hasNext()) {
            String login = sc.next();
            total++;
            if (login.matches("[a-z][a-z0-9_]{2,15}")) {
                ok++;
                System.out.println(login + ": OK");
            } else {
                System.out.println(login + ": ошибка");
            }
        }
        System.out.println("Подходит: " + ok + " из " + total);
    }
}
