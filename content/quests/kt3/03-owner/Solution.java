import java.util.Scanner;

public class KT3 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Animal barsik = new Animal("Барсик", "кот", 3);
        barsik.printInfo();
        Owner owner = new Owner(sc.next());
        barsik.attachOwner(owner);
        barsik.printInfo();
    }
}

class Owner {
    String name;

    Owner(String name) {
        this.name = name;
    }
}

class Animal {
    String name;
    String species;
    int age;
    Owner owner;

    Animal() {
        this("Безымянный", "неизвестно", 1);
    }

    Animal(String name, String species, int age) {
        this.name = name;
        this.species = species;
        this.age = age;
    }

    String ownerName() {
        if (owner == null) {
            return "нет";
        }
        return owner.name;
    }

    void printInfo() {
        System.out.println("Животное: " + name + ", вид: " + species + ", возраст: " + age + ", хозяин: " + ownerName());
    }

    void attachOwner(Owner owner) {
        this.owner = owner;
        System.out.println("У питомца " + name + " теперь хозяин: " + owner.name);
    }
}
