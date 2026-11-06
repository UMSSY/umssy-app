"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/modules/profile";
import { useSkillAnalysis } from "../hooks/use-skill-analysis";
import { SKILL_ANALYSIS_TEXTS as texts, SKILL_EVIDENCE_LABELS } from "../constants/skill-analysis.constants";

export function DetectedSkillsSection() {
  const { query, mutation, analyze } = useSkillAnalysis();
  const status = query.data?.status;
  const failed = mutation.isError || status === "error";
  const skills = (query.data?.skills ?? []).filter((skill) => (skill.evidenceRefs ?? []).length > 0);
  const rejected = mutation.data?.analysis?.rejectedSources ?? [];
  return (
    <SectionCard title={texts.title} className="[&>header]:flex-wrap" action={
      <Button variant="outline" size="sm" disabled={mutation.isPending || query.isFetching} onClick={() => void analyze()}>
        <RotateCw aria-hidden="true" className={mutation.isPending ? "animate-spin" : undefined} />
        {mutation.isPending ? texts.analyzing : texts.analyze}
      </Button>
    }>
      <div aria-live="polite" aria-busy={mutation.isPending} className="space-y-3">
        {query.isPending ? <p role="status">{texts.loading}</p> : null}
        {query.isError ? <p role="alert">{texts.loadFailed}</p> : null}
        {failed && !mutation.isPending ? <p role="alert">{texts.failed}</p> : null}
        {!failed && status === "pending" && !mutation.isPending ? <p role="status">{texts.pending}</p> : null}
        {!mutation.isPending && rejected.length > 0 ? <p role="alert">{texts.rejected} {rejected.map((source) => `${SKILL_EVIDENCE_LABELS[source.type] ?? source.type}: ${source.message}`).join(" ")}</p> : null}
        {!failed && !query.isError && !mutation.isPending && status === "ready" ? (
          skills.length ? <ul className="space-y-2">{skills.map((skill) => (
            <li key={skill.id} className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">{skill.name}</Badge>
              <span>{[...new Set((skill.evidenceRefs ?? []).map((ref) => SKILL_EVIDENCE_LABELS[ref.type] ?? ref.type))].join(", ")}</span>
              <span className="text-text-secondary">{skill.verificationStatus === "approved" ? texts.verified : texts.pendingVerification}</span>
            </li>
          ))}</ul> : <p>{texts.empty}</p>
        ) : null}
      </div>
    </SectionCard>
  );
}
