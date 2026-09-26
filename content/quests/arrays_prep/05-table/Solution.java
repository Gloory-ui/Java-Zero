public class ArraysPrep {
    public static void main(String[] args) {
        int[][] t = {
            {3, 8, 1, 9},
            {5, 2, 7, 4},
            {6, 0, 2, 8}
        };

        for (int i = 0; i < t.length; i++) {
            for (int j = 0; j < t[i].length; j++) {
                System.out.print(t[i][j] + " ");
            }
            System.out.println();
        }

        System.out.print("Вторая строка:");
        for (int j = 0; j < t[1].length; j++) {
            System.out.print(" " + t[1][j]);
        }
        System.out.println();
    }
}
