import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Truck pickup = Truck.createPickup();
        System.out.println("Фабрика выпустила: " + pickup.model + ", " + pickup.capacity + " т");

        Truck truck = new Truck(sc.next(), sc.nextInt());
        if (truck.carriesMoreThan(pickup)) {
            System.out.println(truck.model + " везёт больше, чем " + pickup.model);
        } else if (pickup.carriesMoreThan(truck)) {
            System.out.println(pickup.model + " везёт больше, чем " + truck.model);
        } else {
            System.out.println(truck.model + " и " + pickup.model + " везут поровну");
        }
    }
}

class Truck {
    String model;
    int capacity;

    Truck(String model, int capacity) {
        this.model = model;
        this.capacity = capacity;
    }

    boolean carriesMoreThan(Truck other) {
        return capacity > other.capacity;
    }

    static Truck createPickup() {
        return new Truck("Пикап", 1);
    }
}
