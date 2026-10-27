export interface NlpDictionaryEntry {
  name: string;
  aliases: readonly string[];
  ambiguousAliases?: readonly string[];
  blockedPreviousTerms?: readonly string[];
}
