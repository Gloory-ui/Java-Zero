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
        books.sort(Comparator.comparing(Book::year));
        printYears("По году:", books);
        books.sort(Comparator.comparing(Book::author).thenComparing(Book::title));
        printAuthors("По автору:", books);
        books.sort(Comparator.comparing(Book::year).reversed());
        printYears("Сначала новые:", books);
    }
}
