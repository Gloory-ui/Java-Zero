import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lab } from "@/components/lab/lab";
import { Markdown } from "@/components/markdown";
import { findStage, getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { applyQuestOverrides, applyStageOverrides, loadOverrides } from "@/lib/content/overrides";
import { duelQuestions } from "@/lib/game/duel";

export const dynamicParams = false;
// Правки текстов из админки: страница пересобирается не чаще раза в минуту, а после сохранения — сразу
export const revalidate = 60;

export function generateStaticParams() {
  return getCourse().flatMap((quest) => quest.stages.map((stage) => ({ quest: quest.id, stage: stage.id })));
}

export async function generateMetadata({ params }: PageProps<"/learn/[quest]/[stage]">): Promise<Metadata> {
  const { quest: questId, stage: stageId } = await params;
  const found = findStage(questId, stageId);
  if (!found) return {};
  const overrides = await loadOverrides();
  const quest = applyQuestOverrides(found.quest, overrides);
  const stage = applyStageOverrides(found.stage, overrides);
  return {
    title: `${stage.title} · ${quest.title}`,
    description: `${found.stage.badge}. Задание по Java с проверкой настоящим компилятором прямо в браузере.`,
    // Задания КТ — раздел для группы: в поиске им делать нечего
    ...(found.quest.track === "group" ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function StagePage({ params }: PageProps<"/learn/[quest]/[stage]">) {
  const { quest: questId, stage: stageId } = await params;
  const found = findStage(questId, stageId);
  if (!found) notFound();
  const overrides = await loadOverrides();
  const quest = applyQuestOverrides(found.quest, overrides);
  const stage = applyStageOverrides(found.stage, overrides);

  return (
    // key: переход на соседний этап — тот же маршрут, без ключа React сохранил бы результат и ввод прошлого этапа
    <Lab
      key={`${quest.id}/${stage.id}`}
      course={toOutline(getCourse().map((q) => applyQuestOverrides(q, overrides)))}
      questId={quest.id}
      stageIndex={stage.index}
      stage={{
        id: stage.id,
        title: stage.title,
        badge: stage.badge,
        hints: stage.hints,
        sampleInput: stage.sampleInput,
        quiz: stage.quiz,
        memory: stage.memory,
        loopTracer: stage.loopTracer,
        tests: stage.tests,
        starter: stage.starter,
        solution: stage.solution,
        duel: duelQuestions(
          quest.stages.map((s) => s.exam),
          stage.index,
        ),
      }}
      theory={
        <article>
          <p className="mb-2 font-mono text-xs tracking-widest text-gold uppercase">{stage.badge}</p>
          <Markdown>{stage.theory}</Markdown>
        </article>
      }
      pitfalls={<Markdown>{stage.pitfalls}</Markdown>}
    />
  );
}
