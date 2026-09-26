abstract class Shape {
    abstract double area();
    abstract String name();
}

class Rectangle extends Shape {
    double width;
    double height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    double area() {
        return width * height;
    }

    @Override
    String name() {
        return "Прямоугольник";
    }
}

class Triangle extends Shape {
    double base;
    double height;

    public Triangle(double base, double height) {
        this.base = base;
        this.height = height;
    }

    @Override
    double area() {
        return 0; // Замени: основание на высоту пополам
    }

    @Override
    String name() {
        return "?"; // Замени: «Треугольник»
    }
}

// Сделай Square наследником Rectangle: конструктор Square(double side) и имя «Квадрат»
class Square extends Shape {
    public Square(double side) {
    }

    @Override
    double area() {
        return 0;
    }

    @Override
    String name() {
        return "?";
    }
}

public class Inheritance {
    public static void main(String[] args) {
        Shape[] shapes = { new Rectangle(3, 4), new Triangle(6, 5), new Square(5) };
        double total = 0;
        for (int i = 0; i < shapes.length; i++) {
            System.out.println(shapes[i].name() + ": " + shapes[i].area());
            total += shapes[i].area();
        }
        System.out.println("Общая площадь: " + total);
    }
}
