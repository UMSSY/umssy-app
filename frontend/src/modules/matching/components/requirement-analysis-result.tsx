"use client";

import { FileSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { REQUIREMENT_ANALYSIS_MESSAGES } from "../constants/requirement-analysis.constants";
import type { RequirementAnalysis } from "../types/requirement-terms.types";
import { formatAnalysisTime } from "../utils/format-analysis-time";
import { SkillsDetectedList } from "./skills-detected-list";

interface RequirementAnalysisResultProps {
  analysis: RequirementAnalysis;
}

export function RequirementAnalysisResult({ analysis }: RequirementAnalysisResultProps) {
  const { result, elapsedMs } = analysis;
  const tokenSet = new Set(result.tokens);
  const compoundTerms = result.terms.filter((term) => !tokenSet.has(term));
  const isEmpty = result.tokens.length === 0 && result.terms.length === 0;

  if (isEmpty) {
    return (
      <div
        role="status"
        className="flex max-w-xl flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center"
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-surface-soft">
          <FileSearch className="size-6 text-text-secondary" aria-hidden="true" />
        </div>
        <h2 className="font-tight text-lg font-bold text-ink">
          {REQUIREMENT_ANALYSIS_MESSAGES.emptyTitle}
        </h2>
        <p className="text-sm text-text-secondary">{REQUIREMENT_ANALYSIS_MESSAGES.emptyText}</p>
        <p className="text-xs font-semibold text-text-secondary">{formatAnalysisTime(elapsedMs)}</p>
      </div>
    );
  }

  return (
    <Card className="gap-5 px-4 py-4">
      <h2 className="font-tight text-xl font-bold text-ink">
        {REQUIREMENT_ANALYSIS_MESSAGES.resultTitle}
      </h2>

      {result.skills.length > 0 ? (
        <SkillsDetectedList skills={result.skills} />
      ) : (
        <p className="text-sm text-text-secondary">{REQUIREMENT_ANALYSIS_MESSAGES.noSkills}</p>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-lg font-bold text-ink">
          {REQUIREMENT_ANALYSIS_MESSAGES.institutionsTitle}
        </h3>
        {result.institutions.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {result.institutions.map((institution) => (
              <li key={institution}>
                <Badge variant="secondary">{institution}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-secondary">
            {REQUIREMENT_ANALYSIS_MESSAGES.noInstitutions}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-lg font-bold text-ink">{REQUIREMENT_ANALYSIS_MESSAGES.tokensTitle}</h3>
        <ul className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
          {result.tokens.map((token) => (
            <li key={token}>
              <Badge variant="outline">{token}</Badge>
            </li>
          ))}
        </ul>
      </section>

      {compoundTerms.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-ink">
            {REQUIREMENT_ANALYSIS_MESSAGES.compoundTitle}
          </h3>
          <ul className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
            {compoundTerms.map((term) => (
              <li key={term}>
                <Badge variant="outline">{term}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs font-semibold text-text-secondary">{formatAnalysisTime(elapsedMs)}</p>
    </Card>
  );
}
