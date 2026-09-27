import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.OptionalDouble;
import java.util.Scanner;
import java.util.TreeMap;
import java.util.stream.Collectors;

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

    List<Book> sortedBy(String key) {
        Comparator<Book> order = switch (key) {
            case "year" -> Comparator.comparingInt(Book::year);
            case "title" -> Comparator.comparing(Book::title);
            case "author" -> Comparator.comparing(Book::author).thenComparing(Book::title);
            default -> throw new IllegalArgumentException("Сортировка: year, title или author");
        };
        return books.values().stream().sorted(order).toList();
    }

    Map<String, Long> countByAuthor() {
        return books.values().stream()
            .collect(Collectors.groupingBy(Book::author, TreeMap::new, Collectors.counting()));
    }

    OptionalDouble averageYear() {
        return books.values().stream().mapToInt(Book::year).average();
    }

    Optional<Book> oldest() {
        return books.values().stream().min(Comparator.comparingInt(Book::year));
    }

    // Очистить книги и выдачи
    void clear() {
    }

    // Заголовок «id;title;author;year;reader», потом строка на каждую книгу; вернуть число книг
    int save(Path file) throws IOException {
        return 0;
    }

    // Очистить, прочитать файл (split(";", -1)), восстановить книги и выдачи; вернуть число книг
    int load(Path file) throws IOException {
        return 0;
    }
}

public class LibraryApp {
    static final Path DATA = Path.of("library.csv");

    static Library demo() {
        Library lib = new Library();
        lib.add(new Book("B1", "Мастер и Маргарита", "Булгаков", 1967));
        lib.add(new Book("B2", "Война и мир", "Толстой", 1869));
        lib.add(new Book("B3", "Собачье сердце", "Булгаков", 1925));
        lib.add(new Book("B4", "Преступление и наказание", "Достоевский", 1866));
        return lib;
    }

    static void list(Library lib) {
        if (lib.all().isEmpty()) {
            System.out.println("Каталог пуст");
            return;
        }
        Map<String, String> hands = lib.onHands();
        for (Book book : lib.all()) {
            String reader = hands.get(book.id());
            System.out.println(book.line() + (reader == null ? "" : " — у " + reader));
        }
    }

    static void stats(Library lib) {
        System.out.println("По авторам: " + lib.countByAuthor());
        System.out.println("Средний год: " + lib.averageYear().orElse(0));
        lib.oldest().ifPresent(b -> System.out.println("Самая старая: " + b.title() + " (" + b.year() + ")"));
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
            try {
                switch (cmd) {
                    case "list" -> list(lib);
                    case "find" -> System.out.println("Найдено: " + lib.search(arg).stream().map(Book::title).toList());
                    case "borrow" -> {
                        String[] who = arg.split("\\s+", 2);
                        if (who.length < 2) {
                            System.out.println("Формат: borrow номер имя");
                        } else {
                            lib.borrow(who[0], who[1]);
                            System.out.println(who[0] + " выдана: " + who[1]);
                        }
                    }
                    case "return" -> {
                        lib.giveBack(arg);
                        System.out.println(arg + " возвращена");
                    }
                    case "sort" -> lib.sortedBy(arg).forEach(b -> System.out.println(b.line()));
                    case "stats" -> stats(lib);
                    case "save" -> System.out.println("Сохранено книг: " + lib.save(DATA));
                    case "load" -> System.out.println("Загружено книг: " + lib.load(DATA));
                    case "clear" -> {
                        lib.clear();
                        System.out.println("Каталог очищен");
                    }
                    default -> System.out.println("Неизвестная команда: " + cmd);
                }
            } catch (BookNotFoundException | AlreadyBorrowedException | IllegalStateException
                | IllegalArgumentException e) {
                System.out.println("Ошибка: " + e.getMessage());
            } catch (NoSuchFileException e) {
                System.out.println("Файл не найден");
            } catch (IOException e) {
                System.out.println("Ошибка файла");
            }
        }
    }

    public static void main(String[] args) {
        run(demo(), new Scanner(System.in));
    }
}
