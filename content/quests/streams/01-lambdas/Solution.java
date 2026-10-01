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
        ops.put("-", (a, b) -> a - b);
        ops.put("*", (a, b) -> a * b);
        ops.put("max", (a, b) -> a > b ? a : b);
        ops.put("pow", (a, b) -> {
            int result = 1;
            for (int i = 0; i < b; i++) {
                result *= a;
            }
            return result;
        });

        int a = 12, b = 5;
        for (Map.Entry<String, Operation> e : ops.entrySet()) {
            System.out.println(a + " " + e.getKey() + " " + b + " = " + e.getValue().apply(a, b));
        }
    }
}
