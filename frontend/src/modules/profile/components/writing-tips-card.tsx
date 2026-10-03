import { SectionCard } from "./section-card";

const WRITING_TIPS = [
  "Usa un titular breve y concreto.",
  "Menciona tu especialidad.",
  "Explica qué oportunidades buscas.",
];

export function WritingTipsCard() {
  return (
    <SectionCard title="Para escribirla mejor">
      <ul className="flex list-disc flex-col gap-1 pl-4 text-[13px] text-text-secondary">
        {WRITING_TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </SectionCard>
  );
}
