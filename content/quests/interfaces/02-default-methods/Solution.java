interface Priced {
    String title();

    int price();

    default int withDiscount(int percent) {
        return price() - price() * percent / 100;
    }
}

class Book implements Priced {
    public String title() {
        return "Книга";
    }

    public int price() {
        return 500;
    }
}

class Coffee implements Priced {
    public String title() {
        return "Кофе";
    }

    public int price() {
        return 200;
    }

    @Override
    public int withDiscount(int percent) {
        return price();
    }
}

class Cake implements Priced {
    public String title() {
        return "Торт";
    }

    public int price() {
        return 850;
    }
}

public class Interfaces {
    public static void main(String[] args) {
        Priced[] items = { new Book(), new Coffee(), new Cake() };
        for (Priced item : items) {
            System.out.println(item.title() + ": " + item.price() + " → " + item.withDiscount(10));
        }
    }
}
