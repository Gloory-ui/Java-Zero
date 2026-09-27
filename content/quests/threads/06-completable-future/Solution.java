import java.util.concurrent.CompletableFuture;

public class Threads {
    public static void main(String[] args) {
        CompletableFuture<Integer> price = CompletableFuture.supplyAsync(() -> 250);
        CompletableFuture<Integer> rate = CompletableFuture.supplyAsync(() -> 90);
        CompletableFuture<Integer> rubles = price.thenCombine(rate, (p, r) -> p * r);
        CompletableFuture<Integer> withTax = rubles.thenApply(x -> x + x / 10);

        System.out.println("Цена: " + price.join());
        System.out.println("Курс: " + rate.join());
        System.out.println("В рублях: " + rubles.join());
        System.out.println("С налогом: " + withTax.join());

        CompletableFuture<Integer> broken = CompletableFuture.supplyAsync(() -> {
            throw new IllegalStateException("сервер недоступен");
        });
        System.out.println("Запасной ответ: " + broken.exceptionally(e -> -1).join());
    }
}
