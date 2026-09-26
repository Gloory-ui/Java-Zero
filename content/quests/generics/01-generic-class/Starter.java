class Pair {
    // Сделай класс обобщённым: Pair<A, B> с полями first и second,
    // геттерами, методом swap() и toString() «(первый, второй)»
    private Object first;
    private Object second;

    Pair(Object first, Object second) {
        this.first = first;
        this.second = second;
    }
}

public class Generics {
    public static void main(String[] args) {
        // Раскомментируй, когда Pair станет обобщённым:
        // Pair<String, Integer> p = new Pair<>("Аня", 19);
        // System.out.println(p);
        // System.out.println(p.getFirst().length() + p.getSecond());
        // Pair<Integer, String> s = p.swap();
        // System.out.println(s);
        // Pair<Double, Boolean> q = new Pair<>(2.5, true);
        // System.out.println(q);
    }
}
