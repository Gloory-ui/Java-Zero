import java.util.Scanner;

public class KT3 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Создай Барсика (кот, 3 года), прочитай n и n новых возрастов
        // После каждого setAge выведи имя и возраст через геттеры
        // Попробуй setName(""), затем setName("Василий") и выведи "Новое имя: " + getName()

    }
}

class Owner {
    String name;

    Owner(String name) {
        this.name = name;
    }
}

class Animal {
    // Задание 7:
    // - Поля name и age — private
    // - Геттеры getName(), getAge() и сеттеры setName(...), setAge(...) с проверками

    static int counter = 0;

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
        counter++;
    }

    static void printCounter() {
        System.out.println("Создано животных: " + counter);
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
