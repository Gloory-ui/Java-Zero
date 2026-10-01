import java.util.LinkedHashMap;
import java.util.Map;

@FunctionalInterface
interface Operation {
    int apply(int a, int b);
}

public class Streams {
    public static void main(String[] args) {
        Map<String, Operation> ops = new LinkedHashMap<>();
        ops.put("+", (a, b) -> a + b);
        // Допиши «-», «*», «max» и «pow» (степень через цикл в блочной лямбде)

        int a = 12, b = 5;
        for (Map.Entry<String, Operation> e : ops.entrySet()) {
            System.out.println(a + " " + e.getKey() + " " + b + " = " + e.getValue().apply(a, b));
        }
    }
}
