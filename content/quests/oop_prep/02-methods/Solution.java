import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Truck truck = new Truck();
        truck.length = sc.nextInt();
        truck.width = sc.nextInt();
        truck.height = sc.nextInt();

        truck.printInfo();
        System.out.println("Объём: " + truck.getVolume());
    }
}

class Truck {
    int length;
    int width;
    int height;

    void printInfo() {
        System.out.println("Грузовик " + length + " на " + width + " на " + height);
    }

    int getVolume() {
        return length * width * height;
    }
}
