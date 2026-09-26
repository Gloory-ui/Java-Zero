import java.util.Scanner;

public class Exceptions {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int count = 0, sum = 0;
        while (sc.hasNext()) {
            String word = sc.next();
            try {
                int n = Integer.parseInt(word);
                sum += n;
                count++;
            } catch (NumberFormatException e) {
                System.out.println("Пропускаю: " + word);
            }
        }
        System.out.println("Чисел: " + count);
        System.out.println("Сумма: " + sum);
    }
}
