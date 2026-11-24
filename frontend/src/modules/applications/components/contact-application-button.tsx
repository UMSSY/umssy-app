import { Button } from "@/components/ui/button";
import { APPLICATION_MESSAGES } from "../constants/application.constants";
import type { ContactApplicationButtonProps } from "../types/contact-application-button-props.types";

export function ContactApplicationButton({
  application,
  contactingId,
  onContact,
  className,
}: ContactApplicationButtonProps) {
  const isContacting = contactingId === application.id;

  return (
    <Button
      size="sm"
      className={className}
      disabled={contactingId !== null}
      aria-busy={isContacting}
      onClick={() => onContact(application)}
    >
      {isContacting ? APPLICATION_MESSAGES.contacting : APPLICATION_MESSAGES.contact}
    </Button>
  );
}
