export interface ChatMessageToastProps {
  title: string;
  preview: string;
  siteLabel: string;
  actionLabel: string;
  onOpen?: () => void;
  onClose: () => void;
}