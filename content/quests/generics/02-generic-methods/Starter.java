import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Generics {
    // Напиши firstOrDefault, countEqual и swap — обобщённые методы с <T>

    public static void main(String[] args) {
        List<String> names = List.of("Аня", "Борис", "Аня");
        // System.out.println(firstOrDefault(names, "никого"));
        // System.out.println(firstOrDefault(new ArrayList<String>(), "никого"));
        // System.out.println(countEqual(names, "Аня"));
        Integer[] nums = { 1, 2, 3 };
        // swap(nums, 0, 2);
        System.out.println(Arrays.toString(nums));
    }
}
