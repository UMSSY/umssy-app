import type { CandidateWithMatch } from "./candidate-with-match.types";

export interface CandidateListProps {
  query: string;
  onQueryChange: (query: string) => void;
  candidates: CandidateWithMatch[];
  selectedCandidateId: string | null;
  onSelectCandidate: (id: string) => void;
}
