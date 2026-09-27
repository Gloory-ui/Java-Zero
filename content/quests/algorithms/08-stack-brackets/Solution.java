import java.util.Arrays;
import java.util.Scanner;

class CharStack {
    private char[] data = new char[16];
    private int size;

    void push(char c) {
        if (size == data.length) {
            data = Arrays.copyOf(data, size * 2);
        }
        data[size++] = c;
    }

    char pop() {
        return data[--size];
    }

    boolean isEmpty() {
        return size == 0;
    }

    int size() {
        return size;
    }
}

public class Algorithms {
    static String check(String s) {
        CharStack stack = new CharStack();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if ("([{".indexOf(c) >= 0) {
                stack.push(c);
            } else if (")]}".indexOf(c) >= 0) {
                if (stack.isEmpty() || "([{".indexOf(stack.pop()) != ")]}".indexOf(c)) {
                    return "ошибка в позиции " + (i + 1);
                }
            }
        }
        return stack.isEmpty() ? "OK" : "не закрыто " + stack.size();
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        while (sc.hasNextLine()) {
            String line = sc.nextLine();
            System.out.println(line + ": " + check(line));
        }
    }
}
