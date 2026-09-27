public class Strings {
    public static void main(String[] args) {
        String[] names = { "Хлеб", "Молоко", "Сыр" };
        int[] counts = { 2, 1, 3 };
        double[] prices = { 45.50, 89.90, 120.00 };
        double total = 0;
        for (int i = 0; i < names.length; i++) {
            double sum = counts[i] * prices[i];
            // Строка чека через printf: "%-8s %2d x %6.2f = %7.2f%n"
            System.out.println(names[i] + " " + sum);
            total += sum;
        }
        System.out.println("Итого: " + total);
    }
}
