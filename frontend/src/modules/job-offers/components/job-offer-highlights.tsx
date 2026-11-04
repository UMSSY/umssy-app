import type { JobOfferHighlightsProps } from "../types/job-offer-highlights-props.types";

const HIGHLIGHT_CLASSES = "rounded-md bg-surface-soft px-4 py-2.5 text-sm font-medium text-ink-soft";

export function JobOfferHighlights({ modality, contractType, vacancies, salary }: JobOfferHighlightsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={HIGHLIGHT_CLASSES}>{modality}</div>
      <div className={HIGHLIGHT_CLASSES}>{contractType}</div>
      <div className={HIGHLIGHT_CLASSES}>{vacancies}</div>
      <div className={HIGHLIGHT_CLASSES}>{salary}</div>
    </div>
  );
}
