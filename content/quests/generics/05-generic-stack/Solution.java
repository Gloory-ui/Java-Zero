import java.util.Arrays;

class MyStack<T> {
    private Object[] data = new Object[2];
    private int size;

    void push(T item) {
        if (size == data.length) {
            data = Arrays.copyOf(data, data.length * 2);
        }
        data[size++] = item;
    }

    @SuppressWarnings("unchecked")
    T pop() {
        if (size == 0) {
            throw new IllegalStateException("Стек пуст");
        }
        T top = (T) data[--size];
        data[size] = null;
        return top;
    }

    @SuppressWarnings("unchecked")
    T peek() {
        if (size == 0) {
            throw new IllegalStateException("Стек пуст");
        }
        return (T) data[size - 1];
    }

    int size() {
        return size;
    }

    boolean isEmpty() {
        return size == 0;
    }
}

public class Generics {
    public static void main(String[] args) {
        MyStack<String> words = new MyStack<>();
        words.push("а");
        words.push("б");
        words.push("в");
        System.out.println("Сверху: " + words.peek());
        System.out.println("Снято: " + words.pop());
        System.out.println("Снято: " + words.pop());
        System.out.println("Размер: " + words.size());

        MyStack<Integer> nums = new MyStack<>();
        for (int i = 1; i <= 5; i++) {
            nums.push(i);
        }
        int sum = 0;
        while (!nums.isEmpty()) {
            sum += nums.pop();
        }
        System.out.println("Сумма: " + sum);
        try {
            nums.pop();
        } catch (IllegalStateException e) {
            System.out.println("Ошибка: " + e.getMessage());
        }
    }
}
