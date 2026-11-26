import type { CandidateListEntry } from "./candidate-list-entry.types";

export interface CandidateListProps {
  emptyMessage?: string;
  query: string;
  onQueryChange: (query: string) => void;
  candidates: CandidateListEntry[];
  selectedCandidateId: string | null;
  onSelectCandidate: (id: string) => void;
}
