import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class Threads {
    public static void main(String[] args) throws InterruptedException {
        String[] texts = { "кот пёс кот", "пёс лис", "кот лис лис" };
        Map<String, Integer> counts = new ConcurrentHashMap<>();
        List<String> done = new CopyOnWriteArrayList<>();
        ExecutorService pool = Executors.newFixedThreadPool(3);
        for (int t = 0; t < texts.length; t++) {
            int id = t + 1;
            String text = texts[t];
            pool.submit(() -> {
                for (String word : text.split(" ")) {
                    counts.merge(word, 1, Integer::sum);
                }
                done.add("текст " + id);
            });
        }
        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.SECONDS);

        System.out.println("Слова: " + new TreeMap<>(counts));
        int total = 0;
        for (int c : counts.values()) {
            total += c;
        }
        System.out.println("Всего слов: " + total);
        System.out.println("Готово: " + done.stream().sorted().toList());
    }
}
