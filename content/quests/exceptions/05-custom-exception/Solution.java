import java.util.Scanner;

class SeatTakenException extends Exception {
    SeatTakenException(int seat) {
        super("Место " + seat + " уже занято");
    }
}

class Cinema {
    private final boolean[] taken = new boolean[10];

    void book(int seat) throws SeatTakenException {
        if (seat < 1 || seat > taken.length) {
            throw new IllegalArgumentException("Нет места " + seat);
        }
        if (taken[seat - 1]) {
            throw new SeatTakenException(seat);
        }
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
            try {
                cinema.book(seat);
                System.out.println("Место " + seat + ": забронировано");
            } catch (SeatTakenException | IllegalArgumentException e) {
                System.out.println(e.getMessage());
            }
        }
        System.out.println("Свободно мест: " + cinema.free());
    }
}
