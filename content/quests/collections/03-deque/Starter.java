import java.util.ArrayDeque;
import java.util.Scanner;

public class CollectionsLab {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        ArrayDeque<String> queue = new ArrayDeque<>();
        while (sc.hasNext()) {
            String word = sc.next();
            char op = word.charAt(0);
            // '+' — в конец, '!' — в начало, '-' — обслужить первого или «Очередь пуста»
        }
        System.out.println("Осталось: " + queue);
    }
}
