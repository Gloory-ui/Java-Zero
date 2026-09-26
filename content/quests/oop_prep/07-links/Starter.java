import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Truck truck = new Truck(sc.next());
        Driver driver = new Driver(sc.next());
        // 1. Выведи грузовик: truck.printInfo();
        // 2. Назначь водителя: truck.assignDriver(driver);
        // 3. Выведи грузовик снова

    }
}

class Driver {
    String name;

    Driver(String name) {
        this.name = name;
    }
}

class Truck {
    String model;
    // Добавь поле-ссылку на водителя

    Truck(String model) {
        this.model = model;
    }

    // Добавь assignDriver(Driver driver) и printInfo()
}
