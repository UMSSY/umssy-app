import type { MentorProfileSuggestion } from '../types/mentor-profile-suggestion.types.js';

export type MentorProfileSuggestionPresentation<
  Field extends MentorProfileSuggestion['field'] =
    MentorProfileSuggestion['field'],
> = Readonly<{
  title: string;
  benefitDescription: string;
  editReference: Readonly<{ section: Field; action: 'edit' }>;
}>;

export type MentorProfileSuggestionResponse = {
  [Code in MentorProfileSuggestion['code']]: Extract<
    MentorProfileSuggestion,
    { code: Code }
  > &
    MentorProfileSuggestionPresentation<
      Extract<MentorProfileSuggestion, { code: Code }>['field']
    >;
}[MentorProfileSuggestion['code']];

export interface MentorProfileSuggestionsResponse {
  readonly suggestions: readonly MentorProfileSuggestionResponse[];
  readonly pendingCount: number;
}
