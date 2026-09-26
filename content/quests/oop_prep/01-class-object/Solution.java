public class OopPrep {
    public static void main(String[] args) {
        Cat barsik = new Cat();
        barsik.name = "Барсик";
        barsik.age = 3;

        Cat murka = new Cat();
        murka.name = "Мурка";
        murka.age = 5;

        System.out.println("Кот: " + barsik.name + ", возраст: " + barsik.age);
        System.out.println("Кот: " + murka.name + ", возраст: " + murka.age);
    }
}

class Cat {
    String name;
    int age;
}
