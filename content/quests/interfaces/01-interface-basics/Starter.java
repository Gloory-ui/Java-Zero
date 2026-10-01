interface Shape {
    double area();

    String name();
}

class Rect {
    double w, h;

    Rect(double w, double h) {
        this.w = w;
        this.h = h;
    }
    // Реализуй Shape: name() — «Прямоугольник», area() — w * h
}

class Triangle {
    double base, height;

    Triangle(double base, double height) {
        this.base = base;
        this.height = height;
    }
    // Реализуй Shape: name() — «Треугольник», area() — base * height / 2
}

public class Interfaces {
    public static void main(String[] args) {
        // Массив Shape[] из прямоугольника 3 × 4 и треугольника с основанием 3 и высотой 4.
        // Выведи имя и площадь каждой фигуры, потом сумму площадей.
    }
}
