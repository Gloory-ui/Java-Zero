class Pair<A, B> {
    private final A first;
    private final B second;

    Pair(A first, B second) {
        this.first = first;
        this.second = second;
    }

    A getFirst() {
        return first;
    }

    B getSecond() {
        return second;
    }

    Pair<B, A> swap() {
        return new Pair<>(second, first);
    }

    @Override
    public String toString() {
        return "(" + first + ", " + second + ")";
    }
}

public class Generics {
    public static void main(String[] args) {
        Pair<String, Integer> p = new Pair<>("Аня", 19);
        System.out.println(p);
        System.out.println(p.getFirst().length() + p.getSecond());
        Pair<Integer, String> s = p.swap();
        System.out.println(s);
        Pair<Double, Boolean> q = new Pair<>(2.5, true);
        System.out.println(q);
    }
}
