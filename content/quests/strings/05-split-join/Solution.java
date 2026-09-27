import java.util.Scanner;

public class Strings {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.nextLine();
        String[] names = line.split(";");
        String longest = "";
        for (int i = 0; i < names.length; i++) {
            names[i] = names[i].trim();
            if (names[i].length() > longest.length()) {
                longest = names[i];
            }
        }
        System.out.println("Имён: " + names.length);
        System.out.println("Список: " + String.join(", ", names));
        System.out.println("Самое длинное: " + longest);
    }
}
