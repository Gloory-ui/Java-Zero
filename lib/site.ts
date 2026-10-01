/** Адрес сайта для sitemap, OG-картинок и ссылок; на превью переопределяется переменной NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://java-zero.onrender.com").replace(/\/$/, "");

/** Индексация включается только на боевом сайте: превью не должны попасть в поиск. */
export const SITE_INDEXED = process.env.SITE_INDEX === "true";
