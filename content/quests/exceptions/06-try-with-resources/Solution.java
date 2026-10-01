class Door implements AutoCloseable {
    private final String name;

    Door(String name) {
        this.name = name;
        System.out.println("Открыта: " + name);
    }

    @Override
    public void close() {
        System.out.println("Закрыта: " + name);
    }
}

public class Exceptions {
    public static void main(String[] args) {
        try (Door a = new Door("A"); Door b = new Door("B")) {
            System.out.println("Прохожу");
        }
        try (Door c = new Door("C")) {
            System.out.println("Сквозняк!");
            throw new IllegalStateException("дверь заклинило");
        } catch (IllegalStateException e) {
            System.out.println("Поймано: " + e.getMessage());
        }
    }
}
