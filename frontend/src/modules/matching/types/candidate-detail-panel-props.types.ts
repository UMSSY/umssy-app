import type { AffinityAxis } from "./affinity-axis.types";
import type { CandidateWithMatch } from "./candidate-with-match.types";
import type { Vacancy } from "./vacancy.types";

export interface CandidateDetailPanelProps {
  candidate: CandidateWithMatch | null;
  vacancy: Vacancy | null;
  axes: AffinityAxis[];
  pendingDiscardId: string | null;
  onRequestDiscard: (id: string) => void;
  onConfirmDiscard: () => void;
  onCancelDiscard: () => void;
  onConfirmSchedule: (name: string, date: string, time: string) => void;
  actionFeedback: string | null;
}
