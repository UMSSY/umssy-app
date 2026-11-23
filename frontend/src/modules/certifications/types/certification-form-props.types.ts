import type { CertificationDocumentChange } from "./certification-document-change.types";
import type { CreateCertificationDto } from "./create-certification-dto.types";

export interface CertificationFormProps {
  requireDocument?:boolean;
  initialData?: CreateCertificationDto;
  currentDocumentName?: string;
  onSubmit: (
    values: CreateCertificationDto,
    documentChange: CertificationDocumentChange,
  ) => Promise<string | null>;
  onValuesChange?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onBusyChange?: (busy: boolean) => void;
  saveLabel?: string;
  onCancel: () => void;
}
