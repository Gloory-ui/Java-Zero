import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class Threads {
    public static void main(String[] args) throws InterruptedException {
        int[] data = { 5, 17, 3, 42, 8, 23, 16, 4, 11 };
        AtomicInteger processed = new AtomicInteger();
        AtomicInteger sum = new AtomicInteger();
        AtomicInteger max = new AtomicInteger(Integer.MIN_VALUE);
        List<Thread> threads = new ArrayList<>();
        for (int part = 0; part < 3; part++) {
            int from = part * 3;
            Thread thread = new Thread(() -> {
                for (int i = from; i < from + 3; i++) {
                    // Обнови processed, sum и max атомарными операциями
                }
            });
            threads.add(thread);
            thread.start();
        }
        for (Thread thread : threads) {
            thread.join();
        }
        System.out.println("Обработано: " + processed.get());
        System.out.println("Сумма: " + sum.get());
        System.out.println("Максимум: " + max.get());
    }
}
