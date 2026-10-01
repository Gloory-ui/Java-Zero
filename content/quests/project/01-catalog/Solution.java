import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

record Book(String id, String title, String author, int year) {
    String line() {
        return id + " | " + title + " | " + author + " | " + year;
    }
}

class Library {
    private final Map<String, Book> books = new LinkedHashMap<>();

    void add(Book book) {
        books.put(book.id(), book);
    }

    List<Book> all() {
        return new ArrayList<>(books.values());
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
