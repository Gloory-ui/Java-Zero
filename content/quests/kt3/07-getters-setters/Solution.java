import java.util.Scanner;

public class KT3 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Animal barsik = new Animal("Барсик", "кот", 3);
        int n = sc.nextInt();
        for (int i = 0; i < n; i++) {
            barsik.setAge(sc.nextInt());
            System.out.println(barsik.getName() + ": " + barsik.getAge());
        }
        barsik.setName("");
        barsik.setName("Василий");
        System.out.println("Новое имя: " + barsik.getName());
    }
}

class Owner {
    String name;

    Owner(String name) {
        this.name = name;
    }
}

class Animal {
    static int counter = 0;

    private String name;
    String species;
    private int age;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        if (name == null || name.isEmpty()) {
            System.out.println("Ошибка: имя не может быть пустым");
        } else {
            this.name = name;
        }
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        if (age > 0) {
            this.age = age;
        } else {
            System.out.println("Ошибка: возраст должен быть больше 0");
        }
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
