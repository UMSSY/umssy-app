import type { Application } from "./application.types";

export interface ContactApplicationButtonProps {
  application: Application;
  contactingId: string | null;
  onContact: (application: Application) => void;
  className?: string;
}
