export interface RequirementTermsResult {
  tokens: string[];
  terms: string[];
  skills: string[];
  institutions: string[];
}

export interface RequirementAnalysis {
  result: RequirementTermsResult;
  elapsedMs: number;
}
