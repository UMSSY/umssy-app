import type { CandidateWithMatch } from "./candidate-with-match.types";

export interface CandidateListItemProps {
  candidate: CandidateWithMatch;
  selected: boolean;
  onSelect: (id: string) => void;
}
