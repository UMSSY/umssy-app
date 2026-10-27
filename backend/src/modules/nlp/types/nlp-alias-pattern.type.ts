export interface NlpAliasPattern {
  skillName: string;
  tokens: readonly string[];
  isAmbiguous: boolean;
  blockedPreviousTerms: ReadonlySet<string>;
}
