import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Scanner;
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

    void borrow(String id, String reader) throws BookNotFoundException, AlreadyBorrowedException {
        if (!books.containsKey(id)) {
            throw new BookNotFoundException(id);
        }
        String current = borrowedBy.get(id);
        if (current != null) {
            throw new AlreadyBorrowedException(id, current);
        }
        borrowedBy.put(id, reader);
    }

    void giveBack(String id) throws BookNotFoundException {
        if (!books.containsKey(id)) {
            throw new BookNotFoundException(id);
        }
        if (borrowedBy.remove(id) == null) {
            throw new IllegalStateException("Книга " + id + " и так в библиотеке");
        }
    }

    Map<String, String> onHands() {
        return new TreeMap<>(borrowedBy);
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

    // Каталог: у выданных книг в конце « — у Имя»
    static void list(Library lib) {
    }

    static void run(Library lib, Scanner sc) {
        while (sc.hasNextLine()) {
            String line = sc.nextLine().trim();
            if (line.isEmpty()) {
                continue;
            }
            String[] parts = line.split("\\s+", 2);
            String cmd = parts[0].toLowerCase();
            String arg = parts.length > 1 ? parts[1] : "";
            if (cmd.equals("exit")) {
                System.out.println("До встречи!");
                return;
            }
            // switch по cmd в try: list, find, borrow, return, остальное — «Неизвестная команда: ...»
        }
    }

    public static void main(String[] args) {
        run(demo(), new Scanner(System.in));
    }
}
