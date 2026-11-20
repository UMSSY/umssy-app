export type CvReview = {
  cv_id: string;
  user_id: string;
  extraction_status: string;
  review_status: string;
  submitted_at: Date;
  cv_file_name: string | null;
  extracted_chars: number;
};
