public class LoopsPrep {
    public static void main(String[] args) {
        int sumEven = 0;
        int sumOdd = 0;

        for (int i = 1; i <= 10; i++) {
            if (i % 2 == 0) {
                sumEven += i;
            } else {
                sumOdd += i;
            }
        }
        System.out.println(sumEven);
        System.out.println(sumOdd);
    }
}
