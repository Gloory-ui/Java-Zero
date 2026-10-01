public class Algorithms {
    static long linearSteps(int n) {
        return 0;
    }

    static long binarySteps(int n) {
        // Сколько раз n делится пополам до нуля
        return 0;
    }

    static long pairSteps(int n) {
        // n × (n − 1) / 2 без переполнения
        return 0;
    }

    public static void main(String[] args) {
        int[] sizes = { 8, 1024, 1_000_000 };
        for (int n : sizes) {
            System.out.println("n = " + n + ": линейно " + linearSteps(n) + ", бинарно " + binarySteps(n)
                + ", пары " + pairSteps(n));
        }
    }
}
