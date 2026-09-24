import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lab } from "@/components/lab/lab";
import { Markdown } from "@/components/markdown";
import { findStage, getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { duelQuestions } from "@/lib/game/duel";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCourse().flatMap((quest) => quest.stages.map((stage) => ({ quest: quest.id, stage: stage.id })));
}

export async function generateMetadata({ params }: PageProps<"/learn/[quest]/[stage]">): Promise<Metadata> {
  const { quest: questId, stage: stageId } = await params;
  const found = findStage(questId, stageId);
  if (!found) return {};
  return {
    title: `${found.stage.title} · ${found.quest.title}`,
    description: `${found.stage.badge}. Задание по Java с проверкой настоящим компилятором прямо в браузере.`,
  };
}

export default async function StagePage({ params }: PageProps<"/learn/[quest]/[stage]">) {
  const { quest: questId, stage: stageId } = await params;
  const found = findStage(questId, stageId);
  if (!found) notFound();
  const { quest, stage } = found;

  return (
    <Lab
      course={toOutline(getCourse())}
      questId={quest.id}
      stageIndex={stage.index}
      stage={{
        id: stage.id,
        title: stage.title,
        badge: stage.badge,
        hint: stage.hint,
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
