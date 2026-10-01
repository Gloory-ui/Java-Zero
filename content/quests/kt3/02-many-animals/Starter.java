import java.util.Scanner;

public class KT3 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Прочитай n, затем n животных: имя, вид и возраст
        // Создай каждое конструктором и выведи через printInfo()

    }
}

class Animal {
    // Задание 2:
    // - Класс готов: в этом задании меняется только main

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
