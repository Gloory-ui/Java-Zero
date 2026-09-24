public class KT1 {
    public static void main(String[] args) {
        for (int i = 1; i <= 50; i++) {
            if (i == 41) {
                break;
            }
            if (i % 5 == 0 || i % 7 == 0) {
                continue;
            }
            System.out.println(i);
        }
    }
}
