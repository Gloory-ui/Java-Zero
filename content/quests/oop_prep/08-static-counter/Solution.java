import java.util.Scanner;

public class OopPrep {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        for (int i = 0; i < n; i++) {
            Coupon c = new Coupon();
            System.out.println("Талон №" + c.number);
        }
        Coupon.printIssued();
    }
}

class Coupon {
    static int issued = 0;
    int number;

    Coupon() {
        issued++;
        number = issued;
    }

    static void printIssued() {
        System.out.println("Выдано талонов: " + issued);
    }
}
