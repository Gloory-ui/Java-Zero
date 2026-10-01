import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Страница не найдена" };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex min-h-[70dvh] max-w-xl flex-col justify-center gap-5 px-4 py-16">
        <p className="font-mono text-sm text-danger">Exception in thread "main" java.lang.PageNotFoundException: 404</p>
        <h1 className="font-display text-3xl font-semibold">Такой страницы нет</h1>
        <p className="text-muted">
          Возможно, ссылка устарела: в новой версии курса адреса этапов изменились. Весь курс собран на карте.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/course">Карта курса</ButtonLink>
          <ButtonLink href="/" variant="ghost">
            На главную
          </ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
