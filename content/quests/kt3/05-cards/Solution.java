import java.util.Scanner;

public class KT3 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Animal[] shelter = {
            new Animal("Барсик", "кот", 3),
            new Animal("Шарик", "собака", 5),
            new Animal("Кеша", "попугай", 2)
        };
        shelter[0].medicalHistory = "Прививка от бешенства, 2025";
        shelter[1].medicalHistory = "Перелом лапы, вылечен";

        for (int i = 0; i < shelter.length; i++) {
            shelter[i].printShort(i + 1);
        }

        while (true) {
            System.out.println("Номер карточки (0 — выход):");
            int number = sc.nextInt();
            if (number == 0) {
                break;
            }
            if (number < 1 || number > shelter.length) {
                System.out.println("Нет такой карточки");
            } else {
                shelter[number - 1].printCard();
            }
        }
        System.out.println("До свидания!");
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
    String medicalHistory = "Записей нет";

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

    void celebrateBirthday() {
        age++;
        System.out.println("С днём рождения, " + name + "! Теперь возраст: " + age);
    }

    void printShort(int number) {
        System.out.println("[" + number + "] " + name + " (" + species + ", " + age + ")");
    }

    void printCard() {
        System.out.println("===== Карточка: " + name + " =====");
        System.out.println("Вид: " + species);
        System.out.println("Возраст: " + age);
        System.out.println("Хозяин: " + ownerName());
        System.out.println("Медицинская история: " + medicalHistory);
    }
}
