public class Calculator {
    public static void main(String[] args) {
        double[] history = new double[5];

        for (int i = 0; i < history.length; i++) {
            history[i] = (i + 1) * 1.5;
        }

        for (int i = 0; i < history.length; i++) {
            System.out.println(history[i]);
        }

        System.out.println("Всего записей: " + history.length);
    }
}
