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
        // Пул из трёх потоков, задачи factorial(5..9) через submit, результаты через get,
        // потом shutdown и awaitTermination
        for (int n = 5; n <= 9; n++) {
            System.out.println(n + "! = " + factorial(n));
        }
    }
}
