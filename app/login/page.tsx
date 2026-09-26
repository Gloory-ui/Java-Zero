import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/account/login-form";

export const metadata: Metadata = {
  title: "Вход",
  description: "Войди, чтобы прогресс по курсу Java-Zero сохранялся в аккаунте и открывался на любом устройстве.",
};

export default function LoginPage() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <Link href="/" className="font-display text-base font-semibold">
        Java-Zero
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold">Вход</h1>
        <p className="text-muted">
          Прогресс сохранится в аккаунте и откроется на любом устройстве. Учиться можно и без входа.
        </p>
      </div>
      <LoginForm />
      <p className="text-xs text-muted">
        Какие данные хранит аккаунт и как их удалить —{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-text">
          политика конфиденциальности
        </Link>
        .
      </p>
    </main>
  );
}
