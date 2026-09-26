import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Truck truck = new Truck(sc.next());
        Driver driver = new Driver(sc.next());

        truck.printInfo();
        truck.assignDriver(driver);
        truck.printInfo();
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
    Driver driver;

    Truck(String model) {
        this.model = model;
    }

    void assignDriver(Driver driver) {
        this.driver = driver;
        System.out.println("Водитель " + driver.name + " назначен на " + model);
    }

    void printInfo() {
        if (driver == null) {
            System.out.println("Грузовик " + model + ", водитель: нет");
        } else {
            System.out.println("Грузовик " + model + ", водитель: " + driver.name);
        }
    }
}
