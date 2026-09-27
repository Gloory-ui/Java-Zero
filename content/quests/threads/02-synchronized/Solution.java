import java.util.ArrayList;
import java.util.List;

class Counter {
    private int count;

    synchronized void increment() {
        count++;
    }

    synchronized int get() {
        return count;
    }
}

public class Threads {
    public static void main(String[] args) throws InterruptedException {
        Counter counter = new Counter();
        List<Integer> log = new ArrayList<>();
        List<Thread> threads = new ArrayList<>();
        for (int t = 1; t <= 4; t++) {
            int id = t;
            Thread thread = new Thread(() -> {
                for (int i = 0; i < 10_000; i++) {
                    counter.increment();
                }
                for (int i = 0; i < 5; i++) {
                    synchronized (log) {
                        log.add(id);
                    }
                }
            });
            threads.add(thread);
            thread.start();
        }
        for (Thread thread : threads) {
            thread.join();
        }
        System.out.println("Счётчик: " + counter.get());
        System.out.println("Записей в журнале: " + log.size());
    }
}
