import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

public class Threads {
    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<String> queue = new ArrayBlockingQueue<>(2);
        Thread waiter = new Thread(() -> {
            for (int i = 1; i <= 5; i++) {
                // Заменить на put, чтобы заказ ждал места, а не терялся
                queue.offer("заказ " + i);
            }
            // После заказов положи сигнал «СТОП»
        });
        waiter.start();
        int cooked = 0;
        // Повар: take() в цикле, «Готовлю: ...», выход на «СТОП»
        waiter.join();
        System.out.println("Все заказы готовы: " + cooked);
    }
}
