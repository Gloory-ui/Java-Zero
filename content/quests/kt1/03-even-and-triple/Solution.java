public class KT1 {
    public static void main(String[] args) {
        for (int i = 1; i <= 30; i++) {
            if (i % 2 == 0 && i % 3 == 0) {
                System.out.println(i + " Четное и кратное 3");
            } else if (i % 2 == 0) {
                System.out.println(i + " Четное");
            } else if (i % 3 == 0) {
                System.out.println(i + " Кратное 3");
            } else {
                System.out.println(i);
            }
        }
    }
}
