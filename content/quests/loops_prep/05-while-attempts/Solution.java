public class LoopsPrep {
    public static void main(String[] args) {
        int attempts = 0;
        int maxAttempts = 3;

        while (attempts < maxAttempts) {
            attempts++;
            System.out.println("Попытка " + attempts);
        }
    }
}
