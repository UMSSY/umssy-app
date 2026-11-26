import type { CompanyDocumentCorrectionResponse } from "./company-document-correction-response.types";

export interface CompanyDocumentCorrectionFormProps {
  requestCode: string;
  token: string;
  onSubmitted: (response: CompanyDocumentCorrectionResponse) => void;
  onCancel: () => void;
  onAuthorizationLost: () => void;
}
