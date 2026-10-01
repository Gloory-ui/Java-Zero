import java.util.ArrayList;

public class CollectionsLab {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("хлеб");
        list.add("молоко");
        list.add("сыр");
        System.out.println("Список: " + list);
        list.add(0, "яйца");
        System.out.println("Первым: " + list);
        list.remove("молоко");
        System.out.println("Без молока: " + list);
        list.set(1, "батон");
        System.out.println("Замена: " + list);
        System.out.println("Покупок: " + list.size());
        System.out.println("Есть сыр: " + list.contains("сыр"));
        System.out.println("Где батон: " + list.indexOf("батон"));
    }
}
