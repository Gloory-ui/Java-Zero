interface Swimmer {
    void swim();
}

interface Flyer {
    void fly();
}

class Duck implements Swimmer, Flyer {
    public void swim() {
        System.out.println("Утка плывёт");
    }

    public void fly() {
        System.out.println("Утка летит");
    }
}

class Penguin implements Swimmer {
    public void swim() {
        System.out.println("Пингвин плывёт");
    }
}

class Plane implements Flyer {
    public void fly() {
        System.out.println("Самолёт летит");
    }
}

public class Interfaces {
    public static void main(String[] args) {
        Object[] things = { new Duck(), new Penguin(), new Plane() };
        for (Object t : things) {
            if (t instanceof Swimmer s) {
                s.swim();
            }
            if (t instanceof Flyer f) {
                f.fly();
            }
        }
    }
}
