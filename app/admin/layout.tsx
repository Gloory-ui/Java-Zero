import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: { default: "Админка", template: "%s · Админка" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex min-h-[70dvh] w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <h1 className="font-display text-3xl font-semibold">Админка</h1>
        <AdminShell>{children}</AdminShell>
      </main>
      <SiteFooter />
    </>
  );
}
