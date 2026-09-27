import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

record Book(String id, String title, String author, int year) {
    // Строка «номер | название | автор | год»
    String line() {
        return id;
    }
}

class Library {
    private final Map<String, Book> books = new LinkedHashMap<>();

    // Положи книгу в каталог по её номеру
    void add(Book book) {
    }

    // Все книги в порядке добавления — копией
    List<Book> all() {
        return new ArrayList<>();
    }
}

public class LibraryApp {
    static Library demo() {
        Library lib = new Library();
        lib.add(new Book("B1", "Мастер и Маргарита", "Булгаков", 1967));
        lib.add(new Book("B2", "Война и мир", "Толстой", 1869));
        lib.add(new Book("B3", "Собачье сердце", "Булгаков", 1925));
        lib.add(new Book("B4", "Преступление и наказание", "Достоевский", 1866));
        return lib;
    }

    public static void main(String[] args) {
        Library lib = demo();
        for (Book book : lib.all()) {
            System.out.println(book.line());
        }
        System.out.println("Книг в каталоге: " + lib.all().size());
    }
}
