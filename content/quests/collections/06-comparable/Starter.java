import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class Player {
    String name;
    int score;

    Player(String name, int score) {
        this.name = name;
        this.score = score;
    }
    // Реализуй Comparable<Player>: больше очков — раньше
}

public class CollectionsLab {
    public static void main(String[] args) {
        List<Player> players = new ArrayList<>(List.of(
            new Player("Аня", 120), new Player("Борис", 95),
            new Player("Вика", 140), new Player("Гоша", 95)));
        // Отсортируй через Collections.sort
        for (int i = 0; i < players.size(); i++) {
            Player p = players.get(i);
            System.out.println((i + 1) + ". " + p.name + " — " + p.score);
        }
    }
}
