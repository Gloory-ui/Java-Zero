public class LoopsPrep {
    public static void main(String[] args) {
        int n = 7;
        boolean isPrime = true;

        for (int j = 2; j < n; j++) {
            if (n % j == 0) {
                isPrime = false;
                break;
            }
        }
        if (isPrime) {
            System.out.println("Простое");
        }
    }
}
