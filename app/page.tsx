import { ButtonLink } from "@/components/ui/button";

// Появление через @starting-style: без JS, короче 300 мс, только если пользователь не просил меньше движения
const enter =
  "motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:ease-snappy " +
  "motion-safe:starting:translate-y-2 starting:opacity-0";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-4 py-16">
      <p className={`font-mono text-xs uppercase tracking-[0.2em] text-gold ${enter}`}>v1.0 · в сборке</p>
      <h1 className={`font-display text-4xl leading-tight font-semibold sm:text-5xl ${enter} delay-[40ms]`}>
        Java-Zero переезжает на новый движок
      </h1>
      <p className={`text-lg text-muted ${enter} delay-[80ms]`}>
        Вы на тестовой версии. Здесь ваш код будет проверять настоящий компилятор Java в браузере, а прогресс переедет в
        аккаунт.
      </p>
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 ${enter} delay-[120ms]`}>
        <ButtonLink href="https://java-zero.onrender.com" size="lg">
          Открыть рабочую версию
        </ButtonLink>
        <span className="text-sm text-muted">Курс и ваш прогресс пока там.</span>
      </div>
    </main>
  );
}
