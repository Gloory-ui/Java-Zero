enum Light {
    RED, YELLOW, GREEN
}

public class Interfaces {
    static String action(Light light) {
        // switch: RED — «стой», YELLOW — «жди», GREEN — «иди»
        return "?";
    }

    public static void main(String[] args) {
        for (Light light : Light.values()) {
            System.out.println(light.ordinal() + " " + light + ": " + action(light));
        }
        // Какой сигнал после GREEN? «После GREEN: ...»
    }
}
