import java.util.Scanner;

public class KT3 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Прочитай n и создай n животных из ввода
        // Вызови Animal.printCounter(), создай ещё одно животное конструктором по умолчанию и снова выведи счётчик

    }
}

class Owner {
    String name;

    Owner(String name) {
        this.name = name;
    }
}

class Animal {
    // Задание 6:
    // - static int counter: растёт в конструкторе
    // - static void printCounter()

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
