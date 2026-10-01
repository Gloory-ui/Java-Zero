public class Threads {
    public static void main(String[] args) throws InterruptedException {
        long[] results = new long[2];
        Thread first = new Thread(() -> {
            for (int i = 1; i <= 50_000; i++) {
                results[0] += i;
            }
        });
        Thread second = new Thread(() -> {
            // Сложи 50 001..100 000 в results[1]
        });
        // Запусти оба потока и дождись их через join()
        System.out.println("Первая половина: " + results[0]);
        System.out.println("Вторая половина: " + results[1]);
        System.out.println("Всего: " + (results[0] + results[1]));
    }
}
