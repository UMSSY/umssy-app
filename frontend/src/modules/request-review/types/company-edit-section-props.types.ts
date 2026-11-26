import type {
  CompanyAccessRequestItem,
  UpdateCompanyPayload,
} from "@/modules/access-requests";

export interface CompanyEditSectionProps {
  item: CompanyAccessRequestItem;
  cityName: string;
  isEditing: boolean;
  isSavingEdit: boolean;
  isDataModifiedFromInitial: boolean;
  editForm: UpdateCompanyPayload;
  onChangeForm: (
    updater: (prev: UpdateCompanyPayload) => UpdateCompanyPayload,
  ) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onResetInitialData: () => void;
}
