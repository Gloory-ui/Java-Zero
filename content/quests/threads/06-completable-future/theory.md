## Зачем это нужно

Приложение запрашивает цену товара и курс валюты у двух разных серверов. Ждать первый ответ, потом второй — долго. Лучше запросить оба сразу, а когда придут оба ответа, посчитать итог. `CompletableFuture` описывает такие цепочки: «когда будет это — сделай то».

## Как это работает

```java
import java.util.concurrent.CompletableFuture;

CompletableFuture<Integer> a = CompletableFuture.supplyAsync(() -> 20);  // запустить в фоне
CompletableFuture<Integer> b = CompletableFuture.supplyAsync(() -> 3);

CompletableFuture<Integer> product = a.thenCombine(b, (x, y) -> x * y);  // когда готовы оба
CompletableFuture<String> text = product.thenApply(p -> "Итог: " + p);   // когда готов результат
System.out.println(text.join());                                         // ждём: Итог: 60
```

-   `supplyAsync(поставщик)` запускает задачу в общем пуле потоков.
-   `thenApply(функция)` преобразует результат, когда он появится.
-   `thenCombine(другой, функция)` объединяет два результата.
-   `exceptionally(ошибка -> запасное)` подставляет значение, если задача упала.
-   `join()` ждёт результата. В отличие от `get()`, он не бросает проверяемых исключений.

## Разбор: что выведет программа

```java
CompletableFuture<Integer> broken = CompletableFuture.supplyAsync(() -> 10 / 0);
int safe = broken.exceptionally(e -> 0).join();
System.out.println(safe);
```

Деление на ноль уронило задачу, и `exceptionally` вернул запасной ответ:

```text
0
```

## Твоё задание

Собери цепочку:

1.  Цена товара — 250, курс — 90. Оба значения получи через `supplyAsync`.
2.  Перемножь их через `thenCombine`.
3.  Добавь налог 10% через `thenApply`: `x + x / 10`.
4.  Отдельная задача бросает `IllegalStateException`. Подставь −1 через `exceptionally`.

### Что должна вывести программа

```text
Цена: 250
Курс: 90
В рублях: 22500
С налогом: 24750
Запасной ответ: -1
```
