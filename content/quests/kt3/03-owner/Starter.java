import java.util.Scanner;

public class KT3 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Создай Барсика (кот, 3 года) и выведи его
        // Прочитай имя хозяина, создай Owner, привяжи через attachOwner и выведи Барсика снова

    }
}

// Задание 3: опиши класс Owner с полем name и конструктором Owner(String name)

class Animal {
    // Задание 3:
    // - Поле Owner owner и метод ownerName(): имя хозяина или «нет»
    // - Метод attachOwner(Owner owner)
    // - printInfo() выводит и хозяина

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
