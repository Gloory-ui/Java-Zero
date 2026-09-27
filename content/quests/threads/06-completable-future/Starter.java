import java.util.concurrent.CompletableFuture;

public class Threads {
    public static void main(String[] args) {
        CompletableFuture<Integer> price = CompletableFuture.supplyAsync(() -> 250);
        // Курс 90 через supplyAsync, произведение через thenCombine,
        // налог 10% через thenApply, запасной ответ -1 через exceptionally
        System.out.println("Цена: " + price.join());
    }
}
