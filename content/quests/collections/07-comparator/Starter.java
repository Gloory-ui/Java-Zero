import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class CollectionsLab {
    record Book(String title, String author, int year) { }

    static void printYears(String header, List<Book> books) {
        System.out.println(header);
        for (Book b : books) {
            System.out.println(b.year() + " " + b.title());
        }
    }

    static void printAuthors(String header, List<Book> books) {
        System.out.println(header);
        for (Book b : books) {
            System.out.println(b.author() + ": " + b.title());
        }
    }

    public static void main(String[] args) {
        List<Book> books = new ArrayList<>(List.of(
            new Book("Война и мир", "Толстой", 1869),
            new Book("Анна Каренина", "Толстой", 1877),
            new Book("Мастер и Маргарита", "Булгаков", 1967),
            new Book("Собачье сердце", "Булгаков", 1925),
            new Book("Преступление и наказание", "Достоевский", 1866)));
        // Отсортируй по году и выведи printYears("По году:", books)
        // По автору, затем по названию — printAuthors("По автору:", books)
        // Сначала новые — printYears("Сначала новые:", books)
        printYears("По году:", books);
    }
}
