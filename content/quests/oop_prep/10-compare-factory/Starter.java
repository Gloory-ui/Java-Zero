import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // 1. Создай пикап фабрикой: Truck pickup = Truck.createPickup();
        // 2. Выведи "Фабрика выпустила: Пикап, 1 т"
        // 3. Прочитай второй грузовик: new Truck(sc.next(), sc.nextInt())
        // 4. Сравни: кто везёт больше, или "... и ... везут поровну"

    }
}

class Truck {
    String model;
    int capacity;

    Truck(String model, int capacity) {
        this.model = model;
        this.capacity = capacity;
    }

    // Добавь boolean carriesMoreThan(Truck other)

    // Добавь static Truck createPickup(): пикап грузоподъёмностью 1 т
}
