public class KT2 {
    public static void main(String[] args) {
        int[] odd = new int[10];
        for (int i = 0; i < odd.length; i++) {
            odd[i] = 2 * i + 1;
        }

        for (int i = 0; i < odd.length; i++) {
            if (i > 0) {
                System.out.print(", ");
            }
            System.out.print(odd[i]);
        }
        System.out.println();
    }
}
