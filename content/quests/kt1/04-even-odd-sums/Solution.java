public class KT1 {
    public static void main(String[] args) {
        int sumEven = 0;
        int sumOdd = 0;

        for (int i = 1; i <= 20; i++) {
            if (i % 2 == 0) {
                System.out.println(i + " - четное");
                sumEven += i;
            } else {
                System.out.println(i + " - нечетное");
                sumOdd += i;
            }
        }

        System.out.println("Сумма четных: " + sumEven);
        System.out.println("Сумма нечетных: " + sumOdd);
    }
}
