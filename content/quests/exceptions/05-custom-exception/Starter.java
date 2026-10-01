import java.util.Scanner;

// Объяви class SeatTakenException extends Exception с сообщением «Место N уже занято»

class Cinema {
    private final boolean[] taken = new boolean[10];

    // Добавь throws SeatTakenException и проверки:
    // номер вне 1–10 — IllegalArgumentException «Нет места N», занятое место — SeatTakenException
    void book(int seat) {
        taken[seat - 1] = true;
    }

    int free() {
        int count = 0;
        for (boolean t : taken) {
            if (!t) {
                count++;
            }
        }
        return count;
    }
}

public class Exceptions {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Cinema cinema = new Cinema();
        while (sc.hasNextInt()) {
            int seat = sc.nextInt();
            // Поймай SeatTakenException и IllegalArgumentException, печатай их сообщения
            cinema.book(seat);
            System.out.println("Место " + seat + ": забронировано");
        }
        System.out.println("Свободно мест: " + cinema.free());
    }
}
