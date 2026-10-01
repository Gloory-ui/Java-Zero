import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Generics {
    static <T> T firstOrDefault(List<T> list, T def) {
        return list.isEmpty() ? def : list.get(0);
    }

    static <T> int countEqual(List<T> list, T target) {
        int count = 0;
        for (T item : list) {
            if (item.equals(target)) {
                count++;
            }
        }
        return count;
    }

    static <T> void swap(T[] arr, int i, int j) {
        T tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    public static void main(String[] args) {
        List<String> names = List.of("Аня", "Борис", "Аня");
        System.out.println(firstOrDefault(names, "никого"));
        System.out.println(firstOrDefault(new ArrayList<String>(), "никого"));
        System.out.println(countEqual(names, "Аня"));
        Integer[] nums = { 1, 2, 3 };
        swap(nums, 0, 2);
        System.out.println(Arrays.toString(nums));
    }
}
