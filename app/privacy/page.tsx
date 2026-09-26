import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Какие данные хранит Java-Zero, где они лежат и как их удалить.",
};

const UPDATED = "25 сентября 2026";
const ISSUES_URL = "https://github.com/Gloory-ui/Java-Zero/issues";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 leading-relaxed marker:text-muted">
      {items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: статичный список
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-12 leading-relaxed">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-semibold">Политика конфиденциальности</h1>
          <p className="text-muted">Обновлено {UPDATED}.</p>
          <p>
            Java-Zero — бесплатный учебный проект для изучения Java. Здесь описано, какие данные сайт хранит, где они
            лежат и как их удалить.
          </p>
        </div>

        <Section title="Без входа в аккаунт">
          <p>
            Прогресс по этапам, код, ачивки и настройки хранятся только в твоём браузере (localStorage). На сервер они
            не отправляются. Очистишь данные сайта в браузере — прогресс пропадёт.
          </p>
        </Section>

        <Section title="С аккаунтом">
          <p>Когда ты входишь через GitHub, Google или ссылку на почту, сайт сохраняет:</p>
          <List
            items={[
              "адрес почты, имя и ссылку на аватар из GitHub или Google (при входе по почте — только адрес);",
              "прогресс по этапам: последний код, отметки о сдаче, число попыток, использованные подсказки;",
              "открытые ачивки, серию и настройки: характер AI-ментора и звук.",
            ]}
          />
          <p>
            Данные лежат в базе Supabase. Правила базы разрешают каждому пользователю читать и менять только свои
            записи. Пароли сайт не хранит: вход подтверждают GitHub, Google или письмо на почту.
          </p>
        </Section>

        <Section title="AI-ментор">
          <p>
            Когда ты задаёшь вопрос ментору, сервер отправляет в Google Gemini API твой вопрос, код, ошибки компилятора
            и результаты тестов этого этапа. Больше ничего не отправляется. Не пиши в чат ментора личные данные.
          </p>
          <p>
            Чтобы ограничить частоту вопросов, сервер учитывает IP-адрес гостя или id аккаунта. Эти отметки живут в
            памяти сервера 15 минут и никуда не записываются.
          </p>
        </Section>

        <Section title="Кому передаются данные">
          <List
            items={[
              "Supabase — хранение аккаунта и прогресса;",
              "Google (Gemini API) — ответы AI-ментора;",
              "GitHub и Google — только подтверждение входа, если ты выбрал этот способ;",
              "Render — хостинг сайта, хранит технические журналы запросов.",
            ]}
          />
          <p>
            На сайте нет рекламы, счётчиков и сторонней аналитики. Данные не продаются и не передаются никому, кроме
            перечисленных сервисов.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Сайт не ставит cookies для отслеживания. Сессия входа и прогресс хранятся в localStorage браузера. Java в
            лаборатории работает целиком в браузере и ничего не отправляет на сервер.
          </p>
        </Section>

        <Section title="Как удалить данные">
          <List
            items={[
              "прогресс отдельного квеста — кнопка «Сбросить» в профиле, изменение уходит и в аккаунт;",
              "прогресс без аккаунта — очистить данные сайта в настройках браузера;",
              <>
                аккаунт целиком — напиши запрос в{" "}
                <a
                  href={ISSUES_URL}
                  className="text-accent underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  обсуждениях проекта на GitHub
                </a>
                , и аккаунт со всеми данными будет удалён.
              </>,
            ]}
          />
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
