import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GroupStage } from "@/components/lab/group-stage";
import { Lab } from "@/components/lab/lab";
import { Markdown } from "@/components/markdown";
import { toLabStage } from "@/lib/content/lab-stage";
import { findStage, getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { applyQuestOverrides, applyStageOverrides, loadOverrides } from "@/lib/content/overrides";

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
  // Задания КТ — раздел для группы: ни названия задания в заголовке, ни места в поиске
  if (quest.track === "group") {
    return {
      title: `${found.stage.badge} · ${quest.title}`,
      description: "Задание контрольной точки из раздела «Группа».",
      robots: { index: false, follow: false },
    };
  }
  const stage = applyStageOverrides(found.stage, overrides);
  return {
    title: `${stage.title} · ${quest.title}`,
    description: `${found.stage.badge}. Задание по Java с проверкой настоящим компилятором прямо в браузере.`,
  };
}

export default async function StagePage({ params }: PageProps<"/learn/[quest]/[stage]">) {
  const { quest: questId, stage: stageId } = await params;
  const found = findStage(questId, stageId);
  if (!found) notFound();
  const overrides = await loadOverrides();
  const course = toOutline(getCourse().map((q) => applyQuestOverrides(q, overrides)));

  // Задание КТ участник группы загружает с сервера (/api/group/stage): в HTML и бандлах его нет
  if (found.quest.track === "group") {
    return <GroupStage course={course} questId={found.quest.id} stageId={found.stage.id} badge={found.stage.badge} />;
  }

  const quest = applyQuestOverrides(found.quest, overrides);
  const stage = applyStageOverrides(found.stage, overrides);
  return (
    // key: переход на соседний этап — тот же маршрут, без ключа React сохранил бы результат и ввод прошлого этапа
    <Lab
      key={`${quest.id}/${stage.id}`}
      course={course}
      questId={quest.id}
      stageIndex={stage.index}
      stage={toLabStage(quest, stage)}
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
