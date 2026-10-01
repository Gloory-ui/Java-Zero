interface Shape {
    double area();

    String name();
}

class Rect implements Shape {
    double w, h;

    Rect(double w, double h) {
        this.w = w;
        this.h = h;
    }

    @Override
    public double area() {
        return w * h;
    }

    @Override
    public String name() {
        return "Прямоугольник";
    }
}

class Triangle implements Shape {
    double base, height;

    Triangle(double base, double height) {
        this.base = base;
        this.height = height;
    }

    @Override
    public double area() {
        return base * height / 2;
    }

    @Override
    public String name() {
        return "Треугольник";
    }
}

public class Interfaces {
    public static void main(String[] args) {
        Shape[] shapes = { new Rect(3, 4), new Triangle(3, 4) };
        double total = 0;
        for (Shape s : shapes) {
            System.out.println(s.name() + ": " + s.area());
            total += s.area();
        }
        System.out.println("Сумма площадей: " + total);
    }
}
