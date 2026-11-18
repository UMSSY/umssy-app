export interface ApplicationRow {
  id: string;
  job_offer_id: string;
  user_id: string;
  status_title: string;
  applied_at: Date;
  consent_to_recruiter: boolean;
  consent_to_cv: boolean;
  consent_to_contact: boolean;
}
