import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

public class Threads {
    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<String> queue = new ArrayBlockingQueue<>(2);
        Thread waiter = new Thread(() -> {
            try {
                for (int i = 1; i <= 5; i++) {
                    queue.put("заказ " + i);
                }
                queue.put("СТОП");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        waiter.start();
        int cooked = 0;
        while (true) {
            String order = queue.take();
            if (order.equals("СТОП")) {
                break;
            }
            System.out.println("Готовлю: " + order);
            cooked++;
        }
        waiter.join();
        System.out.println("Все заказы готовы: " + cooked);
    }
}
