public class KT3 {
    public static void main(String[] args) {
        Animal unknown = new Animal();
        Animal barsik = new Animal("Барсик", "кот", 3);
        unknown.printInfo();
        barsik.printInfo();
    }
}

class Animal {
    String name;
    String species;
    int age;

    Animal() {
        this("Безымянный", "неизвестно", 1);
    }

    Animal(String name, String species, int age) {
        this.name = name;
        this.species = species;
        this.age = age;
    }

    void printInfo() {
        System.out.println("Животное: " + name + ", вид: " + species + ", возраст: " + age);
    }
}
