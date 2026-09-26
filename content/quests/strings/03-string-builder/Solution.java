import java.util.Scanner;

public class Strings {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String word = sc.next();
        String reversed = new StringBuilder(word).reverse().toString();
        System.out.println("Наоборот: " + reversed);

        StringBuilder dashed = new StringBuilder();
        for (int i = 0; i < word.length(); i++) {
            dashed.append(word.charAt(i));
            if (i < word.length() - 1) {
                dashed.append('-');
            }
        }
        System.out.println("Через дефис: " + dashed);

        boolean palindrome = word.equalsIgnoreCase(reversed);
        System.out.println("Палиндром: " + (palindrome ? "да" : "нет"));
    }
}
