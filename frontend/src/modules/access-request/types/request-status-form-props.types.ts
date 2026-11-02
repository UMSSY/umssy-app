export interface RequestStatusFormProps {
  isLoading: boolean;
  onLookup: (email: string) => Promise<void>;
}
