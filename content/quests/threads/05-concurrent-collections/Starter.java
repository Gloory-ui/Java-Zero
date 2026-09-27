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
                // Посчитай слова text в counts через merge и добавь «текст id» в done
            });
        }
        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.SECONDS);
        // Выведи «Слова: ...» по алфавиту, «Всего слов: ...» и «Готово: ...» по порядку
        System.out.println("Слова: " + counts);
    }
}
