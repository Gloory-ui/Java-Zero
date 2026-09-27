enum Light {
    RED, YELLOW, GREEN
}

public class Interfaces {
    static String action(Light light) {
        return switch (light) {
            case RED -> "стой";
            case YELLOW -> "жди";
            case GREEN -> "иди";
        };
    }

    public static void main(String[] args) {
        for (Light light : Light.values()) {
            System.out.println(light.ordinal() + " " + light + ": " + action(light));
        }
        Light[] all = Light.values();
        Light next = all[(Light.GREEN.ordinal() + 1) % all.length];
        System.out.println("После GREEN: " + next);
    }
}
