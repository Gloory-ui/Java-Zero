import java.util.Random;

public class ArraysPrep {
    public static void main(String[] args) {
        Random rnd = new Random();
        int[] rolls = new int[10];
        for (int i = 0; i < rolls.length; i++) {
            rolls[i] = rnd.nextInt(6) + 1;
        }

        int sixes = 0;
        System.out.print("Броски:");
        for (int i = 0; i < rolls.length; i++) {
            System.out.print(" " + rolls[i]);
            if (rolls[i] == 6) {
                sixes++;
            }
        }
        System.out.println();
        System.out.println("Шестёрок: " + sixes);
    }
}
