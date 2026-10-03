export interface WorkExperienceItem {
  id: string;
  position: string;
  company: string;
  startDate: string; // formato "YYYY-MM"
  endDate: string | null;
  isCurrent: boolean;
  description: string;
}