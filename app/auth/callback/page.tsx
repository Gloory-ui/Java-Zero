import type { Metadata } from "next";
import { AuthCallback } from "@/components/account/auth-callback";

export const metadata: Metadata = { title: "Вход", robots: { index: false } };

export default function AuthCallbackPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <AuthCallback />
    </main>
  );
}
