export interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  describedBy?: string;
  disabled?: boolean;
  autoComplete?: string;
  toggleAriaLabel?: string;
}
