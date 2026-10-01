import java.util.Random;

public class KT2 {
    public static void main(String[] args) {
        Random rnd = new Random();
        int[][] t = new int[5][6];
        for (int i = 0; i < t.length; i++) {
            for (int j = 0; j < t[i].length; j++) {
                t[i][j] = rnd.nextInt(100);
                System.out.print(t[i][j] + " ");
            }
            System.out.println();
        }

        System.out.print("Третья строка:");
        for (int j = 0; j < t[2].length; j++) {
            System.out.print(" " + t[2][j]);
        }
        System.out.println();
    }
}
