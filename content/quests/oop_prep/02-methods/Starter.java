import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Truck truck = new Truck();
        // 1. Прочитай три числа в поля truck.length, truck.width, truck.height
        // 2. Вызови truck.printInfo();
        // 3. Выведи "Объём: " и truck.getVolume()

    }
}

class Truck {
    int length;
    int width;
    int height;

    // Допиши метод void printInfo() — печатает "Грузовик 4 на 2 на 3"
    // Допиши метод int getVolume() — возвращает length * width * height
}
