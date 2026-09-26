import java.util.Arrays;
import java.util.Scanner;

class CharStack {
    private char[] data = new char[16];
    private int size;

    void push(char c) {
        // Расширь массив при нехватке места и положи c наверх
    }

    char pop() {
        return ' ';
    }

    boolean isEmpty() {
        return size == 0;
    }

    int size() {
        return size;
    }
}

public class Algorithms {
    // Верни «OK», «ошибка в позиции N» или «не закрыто N»
    static String check(String s) {
        CharStack stack = new CharStack();
        return "OK";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        while (sc.hasNextLine()) {
            String line = sc.nextLine();
            System.out.println(line + ": " + check(line));
        }
    }
}
