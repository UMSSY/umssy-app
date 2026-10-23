import type { BuilderQuestion } from "../types/survey-builder.types";

const FIELD_TARGETS: Readonly<Record<string, string>> = {
  title: "survey-title",
  description: "survey-description",
  careerId: "survey-career",
  academicPeriod: "survey-period",
  opensAt: "survey-opens-at",
  closesAt: "survey-closes-at",
  questions: "survey-add-question",
};

const QUESTION_PATH = /^questions\.(\d+)\./;

export function getErrorQuestionId(path: string, questions: readonly BuilderQuestion[]): string | null {
  const match = QUESTION_PATH.exec(path);
  if (!match) return null;
  return questions[Number(match[1])]?.id ?? null;
}

export function getErrorTargetId(path: string, questions: readonly BuilderQuestion[]): string | null {
  const questionId = getErrorQuestionId(path, questions);
  if (questionId) return `question-${questionId}`;
  return FIELD_TARGETS[path] ?? null;
}

export function revealElement(elementId: string | null): void {
  if (!elementId) return;
  const element = document.getElementById(elementId);
  if (!element) return;
  element.scrollIntoView?.({ behavior: "smooth", block: "center" });
  const focusTarget = element.matches("input, textarea, button")
    ? element
    : element.querySelector<HTMLElement>("input, textarea, [role='button']");
  focusTarget?.focus({ preventScroll: true });
}
