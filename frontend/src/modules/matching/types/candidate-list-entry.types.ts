import type { CandidateWithMatch } from "./candidate-with-match.types";

export type CandidateListEntry = Pick<
  CandidateWithMatch,
  "id" | "name" | "role" | "matchPercent" | "technologies"
> &
  Partial<Pick<CandidateWithMatch, "status">>;
