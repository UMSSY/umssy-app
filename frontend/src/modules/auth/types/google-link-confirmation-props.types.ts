import type { GoogleLinkRequest } from "./google-link.types";

export interface GoogleLinkConfirmationProps {
  link: GoogleLinkRequest;
  nextPath?: string | null;
  onSessionStarted?: () => void;
  onCancel: () => void;
  onChooseAnother: () => void;
}
