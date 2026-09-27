class Account {
    private int balance;

    void deposit(int amount) {
        // Сумма ≤ 0 — IllegalArgumentException «Сумма должна быть больше нуля»
        balance += amount;
    }

    void withdraw(int amount) {
        // Сумма ≤ 0 — IllegalArgumentException, больше баланса — IllegalStateException
        balance -= amount;
    }

    int getBalance() {
        return balance;
    }
}

public class Exceptions {
    static void run(Account acc, char op, int amount) {
        try {
            if (op == '+') {
                acc.deposit(amount);
                System.out.println("Пополнение " + amount + ": баланс " + acc.getBalance());
            } else {
                acc.withdraw(amount);
                System.out.println("Снятие " + amount + ": баланс " + acc.getBalance());
            }
        } catch (IllegalArgumentException | IllegalStateException e) {
            System.out.println("Ошибка: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        Account acc = new Account();
        run(acc, '+', 500);
        run(acc, '-', 200);
        run(acc, '-', 1000);
        run(acc, '+', -50);
        run(acc, '-', 300);
    }
}
