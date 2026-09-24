## Ограничение попыток в цикле while

В игре «Угадай число» количество кругов заранее неизвестно, но есть строгий лимит попыток:

```java
int attempts = 0;
int maxAttempts = 3;

while (attempts < maxAttempts) {
    attempts++;
    System.out.println("Попытка: " + attempts);
}
          
```

**Твой квест:** Напиши цикл `while`, который выполняется пока `attempts < 3`, увеличивает счетчик `attempts++` и выводит номер попытки.
