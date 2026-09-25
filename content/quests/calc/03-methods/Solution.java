public class Calculator {
    // p процентов от value
    public static double percent(double value, double p) {
        return value * p / 100;
    }

    // Среднее двух чисел
    public static double average(double a, double b) {
        return (a + b) / 2;
    }

    public static void main(String[] args) {
        System.out.println(percent(200, 15));
        System.out.println(percent(80, 50));
        System.out.println(average(3, 4));
        System.out.println(average(10, -2));
    }
}
