import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    Optional<Book> findById(String id) {
        return Optional.ofNullable(books.get(id));
    }

    List<Book> findByAuthor(String author) {
        return books.values().stream().filter(b -> b.author().equalsIgnoreCase(author)).toList();
    }

    List<Book> search(String part) {
        String needle = part.toLowerCase();
        return books.values().stream().filter(b -> b.title().toLowerCase().contains(needle)).toList();
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
        for (String id : new String[] { "B3", "B9" }) {
            System.out.println(id + ": " + lib.findById(id).map(Book::title).orElse("не найдена"));
        }
        System.out.println("Булгаков: " + lib.findByAuthor("булгаков").stream().map(Book::title).toList());
        System.out.println("Со словом «МИР»: " + lib.search("МИР").stream().map(Book::title).toList());
    }
}
