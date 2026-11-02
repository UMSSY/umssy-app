export type NlpDiscardReason =
  | 'not-in-catalog'
  | 'empty-name'
  | 'name-too-long'
  | 'invalid-characters'
  | 'missing-letter'
  | 'repeated-characters'
  | 'source-too-long';
