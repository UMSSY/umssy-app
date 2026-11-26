import type {
  CompanyAccessRequestItem,
  UpdateCompanyPayload,
} from "@/modules/access-requests";
import type { CompanyResolutionAction } from "./company-resolution-action.types";

export interface CompanyResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CompanyAccessRequestItem;
  cityName: string;
  ocrPercentage: number;
  canResolve: boolean;
  submitting: boolean;
  activeAction: CompanyResolutionAction | null;
  onSelectAction: (action: CompanyResolutionAction | null) => void;
  correctionCategory: string;
  onChangeCorrectionCategory: (value: string) => void;
  correctionDetails: string;
  onChangeCorrectionDetails: (value: string) => void;
  rejectionCategory: string;
  onChangeRejectionCategory: (value: string) => void;
  rejectionDetails: string;
  onChangeRejectionDetails: (value: string) => void;
  onApprove: () => void;
  onCorrection: () => void;
  onReject: () => void;
  isEditingFicha: boolean;
  isSavingEdit: boolean;
  isDataModifiedFromInitial: boolean;
  editForm: UpdateCompanyPayload;
  onChangeEditForm: (
    updater: (prev: UpdateCompanyPayload) => UpdateCompanyPayload,
  ) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onResetInitialData: () => void;
}
