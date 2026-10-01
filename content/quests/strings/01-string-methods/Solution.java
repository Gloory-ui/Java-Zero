public class Strings {
    public static void main(String[] args) {
        String s = "Java-Zero учит Java";
        System.out.println("Длина: " + s.length());
        System.out.println("Первый символ: " + s.charAt(0));
        System.out.println("Последний символ: " + s.charAt(s.length() - 1));
        int zero = s.indexOf("Zero");
        System.out.println("Zero начинается с индекса " + zero);
        System.out.println("Последнее Java с индекса " + s.lastIndexOf("Java"));
        System.out.println("Вырезка: " + s.substring(zero, zero + 4));
        System.out.println("Крупно: " + s.toUpperCase());
        System.out.println("Есть «учит»: " + s.contains("учит"));
        System.out.println("Замена: " + s.replace("Java", "Kotlin"));
    }
}
