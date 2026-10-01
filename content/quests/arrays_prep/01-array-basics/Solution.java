public class ArraysPrep {
    public static void main(String[] args) {
        int[] a = new int[6];

        for (int i = 0; i < a.length; i++) {
            a[i] = (i + 1) * 5;
        }

        for (int i = 0; i < a.length; i++) {
            if (i > 0) {
                System.out.print(", ");
            }
            System.out.print(a[i]);
        }
        System.out.println();
    }
}
