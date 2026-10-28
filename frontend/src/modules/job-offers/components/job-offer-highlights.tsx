import type { JobOfferHighlightsProps } from "../types/job-offer-highlights-props.types";

const HIGHLIGHT_CLASSES = "rounded-md bg-surface-soft px-4 py-2.5 text-sm font-medium text-ink-soft";

// Los cuatro datos principales de la vacante en una cuadrícula de 2 x 2 (vista previa y detalles).
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
