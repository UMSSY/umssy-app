"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { APPLICATION_MESSAGES, getApplicationChatPath } from "../constants/application.constants";
import { applicationService } from "../services/application.service";
import type { Application } from "../types/application.types";
import { canContactApplication } from "../utils/can-contact-application";
import { getContactErrorMessage } from "../utils/get-contact-error-message";
import { notifyRetryableError } from "../utils/notify-retryable-error";

export function useContactApplication() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (application: Application) => applicationService.getContact(application.id),
    onSuccess: (contact) => {
      if (contact.recruiters.length === 0) {
        toast.error(APPLICATION_MESSAGES.noRecruiters);
        return;
      }
      router.push(getApplicationChatPath(contact.applicationId));
    },
  });

  const contact = (application: Application) => {
    if (mutation.isPending) return;
    if (!canContactApplication(application.status)) {
      toast.error(APPLICATION_MESSAGES.contactRestricted);
      return;
    }
    mutation.mutate(application, {
      onError: (error) => notifyRetryableError(error, getContactErrorMessage(error), () => contact(application)),
    });
  };

  return {
    contact,
    contactingId: mutation.isPending ? (mutation.variables?.id ?? null) : null,
  };
}
