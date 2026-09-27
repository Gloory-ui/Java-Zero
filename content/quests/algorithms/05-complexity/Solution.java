public class Algorithms {
    static long linearSteps(int n) {
        return n;
    }

    static long binarySteps(int n) {
        long steps = 0;
        while (n > 0) {
            steps++;
            n /= 2;
        }
        return steps;
    }

    static long pairSteps(int n) {
        return (long) n * (n - 1) / 2;
    }

    public static void main(String[] args) {
        int[] sizes = { 8, 1024, 1_000_000 };
        for (int n : sizes) {
            System.out.println("n = " + n + ": линейно " + linearSteps(n) + ", бинарно " + binarySteps(n)
                + ", пары " + pairSteps(n));
        }
    }
}
