export interface SurveyBuilderTopbarProps {
  title: string;
  isSaving: boolean;
  onCancel: () => void;
  onPreview: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}
