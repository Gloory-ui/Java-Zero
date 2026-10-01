interface Priced {
    String title();

    int price();

    // Добавь default-метод withDiscount(int percent): цена минус percent процентов
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
    // Скидок на кофе нет: переопредели withDiscount
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
            // Допиши цену со скидкой 10%: «Книга: 500 → 450»
            System.out.println(item.title() + ": " + item.price());
        }
    }
}
