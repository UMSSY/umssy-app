export interface SurveyDetailOptionResponse {
  id: string;
  position: number;
  label: string;
}

export interface SurveyDetailQuestionResponse {
  id: string;
  position: number;
  statement: string;
  type: 'single_choice' | 'multiple_choice';
  isRequired: boolean;
  options: SurveyDetailOptionResponse[];
}

export interface SurveyDetailResponse {
  id: string;
  title: string;
  description: string | null;
  status: 'published' | 'draft';
  academicPeriod: string | null;
  opensAt: string | null;
  closesAt: string | null;
  hasAnswered: boolean;
  isExpired: boolean;
  questions: SurveyDetailQuestionResponse[];
}
