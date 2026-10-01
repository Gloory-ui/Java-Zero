public class Exceptions {
    static String[] items = { "кот", null, "пёс" };

    static void pick(String indexText) {
        try {
            int i = Integer.parseInt(indexText);
            System.out.println(items[i].toUpperCase());
        } catch (NumberFormatException e) {
            System.out.println("Не число: " + indexText);
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("Нет элемента с номером " + indexText);
        } catch (NullPointerException e) {
            System.out.println("Пустой элемент");
        } finally {
            System.out.println("--- запрос: " + indexText);
        }
    }

    public static void main(String[] args) {
        pick("0");
        pick("1");
        pick("5");
        pick("два");
    }
}
