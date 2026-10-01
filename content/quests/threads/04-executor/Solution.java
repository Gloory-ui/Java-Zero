import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

public class Threads {
    static long factorial(int n) {
        long result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    public static void main(String[] args) throws InterruptedException, ExecutionException {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        List<Future<Long>> futures = new ArrayList<>();
        for (int n = 5; n <= 9; n++) {
            int k = n;
            futures.add(pool.submit(() -> factorial(k)));
        }
        for (int i = 0; i < futures.size(); i++) {
            System.out.println((i + 5) + "! = " + futures.get(i).get());
        }
        pool.shutdown();
        System.out.println("Пул закрыт: " + pool.awaitTermination(1, TimeUnit.SECONDS));
    }
}
