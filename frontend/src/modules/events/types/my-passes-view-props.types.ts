export interface MyPassesViewProps {
  onOpenWorkshopChat?: (registrationId: string) => void;
  onConfirmCancelRegistration?: (registrationId: string) => void | Promise<void>;
}