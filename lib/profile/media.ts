"use client";

import { loadSupabase } from "@/lib/account/session";

/**
 * Ссылка на картинку, которую можно подставить в <img> и в CSS: только https, без кавычек, скобок и пробелов.
 * Ссылки из публичных профилей задаёт их владелец, поэтому проверяем всегда.
 */
export function safeMediaUrl(url: string | null | undefined): string | null {
  if (!url || url.length > 500) return null;
  return /^https:\/\/[^"'()\s<>]+$/.test(url) ? url : null;
}

export type MediaKind = "avatar" | "banner";

const SIZES: Record<MediaKind, { width: number; height: number }> = {
  avatar: { width: 512, height: 512 },
  banner: { width: 1600, height: 480 },
};

/** Больше этого исходник не берём: браузер телефона может не выдержать декодирование */
export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

export class MediaError extends Error {}

/**
 * Картинка перед загрузкой: обрезка по центру под нужные пропорции и сжатие в WebP.
 * Хранилище принимает до 2 МБ; аватар 512×512 и баннер 1600×480 в WebP выходят в десятки-сотни килобайт.
 */
export async function prepareImage(file: File, kind: MediaKind): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new MediaError("Это не картинка: выбери PNG, JPEG или WebP.");
  if (file.size > MAX_SOURCE_BYTES) throw new MediaError("Картинка больше 10 МБ: выбери файл поменьше.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new MediaError("Не получилось открыть картинку. Попробуй другой файл.");
  }

  const { width, height } = SIZES[kind];
  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const sw = width / scale;
  const sh = height / scale;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new MediaError("Браузер не дал нарисовать картинку.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  if (!blob) throw new MediaError("Не получилось сжать картинку.");
  return blob;
}

/** Загружает картинку в папку аккаунта и возвращает публичную ссылку. Параметр v сбрасывает кэш после замены */
export async function uploadImage(uid: string, kind: MediaKind, blob: Blob): Promise<string> {
  const supabase = await loadSupabase();
  const path = `${uid}/${kind}.webp`;
  const bucket = supabase.storage.from("profile-media");
  const { error } = await bucket.upload(path, blob, { upsert: true, contentType: blob.type, cacheControl: "3600" });
  if (error) throw new MediaError(`Хранилище не приняло картинку: ${error.message}`);
  return `${bucket.getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
}
