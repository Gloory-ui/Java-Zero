import java.util.ArrayDeque;
import java.util.Scanner;

public class CollectionsLab {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        ArrayDeque<String> queue = new ArrayDeque<>();
        while (sc.hasNext()) {
            String word = sc.next();
            char op = word.charAt(0);
            if (op == '+') {
                queue.offerLast(word.substring(1));
            } else if (op == '!') {
                queue.offerFirst(word.substring(1));
            } else if (op == '-') {
                if (queue.isEmpty()) {
                    System.out.println("Очередь пуста");
                } else {
                    System.out.println("Обслужен: " + queue.pollFirst());
                }
            }
        }
        System.out.println("Осталось: " + queue);
    }
}
