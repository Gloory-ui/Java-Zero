public class Exceptions {
    static String[] items = { "кот", null, "пёс" };

    static void pick(String indexText) {
        // Поймай NumberFormatException, ArrayIndexOutOfBoundsException и NullPointerException,
        // а «--- запрос: ...» печатай в finally
        int i = Integer.parseInt(indexText);
        System.out.println(items[i].toUpperCase());
    }

    public static void main(String[] args) {
        pick("0");
        pick("1");
        pick("5");
        pick("два");
    }
}
