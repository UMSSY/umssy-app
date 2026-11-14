import type { CandidateListEntry } from "./candidate-list-entry.types";

export interface CandidateListItemProps {
  candidate: CandidateListEntry;
  selected: boolean;
  onSelect: (id: string) => void;
}
