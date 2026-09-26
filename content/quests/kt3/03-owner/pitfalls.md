## Частые грабли на защите

-   `owner.name` без проверки на `null` у животного без хозяина — `NullPointerException`.
-   Поле `String ownerName` вместо `Owner owner` — это не связь объектов, а просто текст.
-   `owner = owner` без `this` в `attachOwner` оставит поле `null`.
