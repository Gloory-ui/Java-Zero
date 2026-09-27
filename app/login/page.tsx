import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/account/login-form";

export const metadata: Metadata = {
  title: "Вход и регистрация",
  description:
    "Войди или зарегистрируйся, чтобы прогресс по курсу Java-Zero сохранялся в аккаунте и открывался на любом устройстве.",
};

export default function LoginPage() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <Link href="/" className="font-display text-base font-semibold">
        Java-Zero
      </Link>
      {/* Заголовок рисует форма: он меняется — вход, регистрация, код из письма, новый пароль */}
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
