class Door {
    private final String name;

    Door(String name) {
        this.name = name;
        System.out.println("Открыта: " + name);
    }
    // Реализуй AutoCloseable: close() печатает «Закрыта: имя»
}

public class Exceptions {
    public static void main(String[] args) {
        // 1. try-with-resources с дверями A и B, внутри «Прохожу»
        // 2. try-with-resources с дверью C, внутри «Сквозняк!» и
        //    throw new IllegalStateException("дверь заклинило"); поймай и выведи «Поймано: ...»
        Door a = new Door("A");
        System.out.println("Прохожу");
    }
}
