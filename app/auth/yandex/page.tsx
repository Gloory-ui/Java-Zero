import type { Metadata } from "next";
import { YandexCallback } from "@/components/account/yandex-callback";

export const metadata: Metadata = { title: "Вход через Яндекс", robots: { index: false } };

export default function YandexCallbackPage() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <YandexCallback />
    </main>
  );
}
