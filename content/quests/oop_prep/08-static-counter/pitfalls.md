## Частые грабли

-   **Счётчик без `static`.** Тогда у каждого талона свой `issued`, всегда равный 1, и все талоны получат №1.
-   **Обычное поле в `static`-методе.** `static void printIssued() { System.out.println(number); }` не скомпилируется: `non-static variable number cannot be referenced from a static context`.
-   **Вызов через объект.** `coupon.printIssued()` работает, но вводит в заблуждение. Принято писать `Coupon.printIssued()`.
