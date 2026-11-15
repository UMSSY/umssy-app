import type { CvContactField } from "./cv-contact-field.types";
import type { CvExtractedContact } from "./cv-extracted-contact.types";

export interface CvContactReviewProps {
  contact: CvExtractedContact;
  fields?: readonly CvContactField[];
  selected?: readonly CvContactField[];
  onToggle: (field: CvContactField) => void;
  onChange: (changes: Partial<CvExtractedContact>) => void;
}
