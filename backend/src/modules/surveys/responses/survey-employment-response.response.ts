export interface SurveyEmploymentResponse {
  respondentId: string;
  submittedAt: Date;
  employmentStatusLabel: string | null;
  monthlySalaryLabel: string | null;
}
