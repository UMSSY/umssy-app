export interface VariationShift {
  questionId: string;
  questionStatement: string;
  optionId: string;
  optionLabel: string;
  currentPercentage: number;
  previousPercentage: number;
  difference: number;
  direction: 'up' | 'down';
}
