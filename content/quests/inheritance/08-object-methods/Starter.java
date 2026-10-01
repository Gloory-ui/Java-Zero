class Point {
    int x;
    int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    // Переопредели toString(): вид «(x, y)»

    // Переопредели equals(Object o): точки равны, если совпадают x и y
}

public class Inheritance {
    public static void main(String[] args) {
        Point a = new Point(1, 2);
        Point b = new Point(1, 2);
        Point c = a;
        System.out.println(a);
        System.out.println(a == b);
        System.out.println(a.equals(b));
        System.out.println(a == c);
    }
}
