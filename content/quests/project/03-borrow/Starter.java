import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

record Book(String id, String title, String author, int year) {
    String line() {
        return id + " | " + title + " | " + author + " | " + year;
    }
}

class BookNotFoundException extends Exception {
    BookNotFoundException(String id) {
        super("Нет книги с номером " + id);
    }
}

class AlreadyBorrowedException extends Exception {
    AlreadyBorrowedException(String id, String reader) {
        super("Книга " + id + " уже у читателя " + reader);
    }
}

class Library {
    private final Map<String, Book> books = new LinkedHashMap<>();
    private final Map<String, String> borrowedBy = new TreeMap<>();

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

    // Книги нет — BookNotFoundException, уже на руках — AlreadyBorrowedException, иначе запиши читателя
    void borrow(String id, String reader) throws BookNotFoundException, AlreadyBorrowedException {
    }

    // Книги нет — BookNotFoundException, не выдавалась — IllegalStateException «Книга N и так в библиотеке»
    void giveBack(String id) throws BookNotFoundException {
    }

    // Копия словаря «номер → читатель»
    Map<String, String> onHands() {
        return new TreeMap<>();
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

    static void borrow(Library lib, String id, String reader) {
        try {
            lib.borrow(id, reader);
            System.out.println(id + " выдана: " + reader);
        } catch (BookNotFoundException | AlreadyBorrowedException e) {
            System.out.println("Ошибка: " + e.getMessage());
        }
    }

    static void giveBack(Library lib, String id) {
        try {
            lib.giveBack(id);
            System.out.println(id + " возвращена");
        } catch (BookNotFoundException | IllegalStateException e) {
            System.out.println("Ошибка: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        Library lib = demo();
        borrow(lib, "B1", "Аня");
        borrow(lib, "B1", "Борис");
        borrow(lib, "B9", "Вика");
        giveBack(lib, "B1");
        giveBack(lib, "B3");
        borrow(lib, "B1", "Борис");
        System.out.println("На руках: " + lib.onHands());
    }
}
