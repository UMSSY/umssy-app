import { BOLIVIA_TIME_LABEL } from "@/shared/constants/date-time.constants";
import { formatBlockRange } from "@/shared/utils/date-time";
import {
  APPOINTMENT_MESSAGE_MAX_LENGTH,
  REQUEST_APPOINTMENT_TEXT,
} from "../constants/request-appointment.constants";
import type { AppointmentRequestErrors } from "../types/appointment-request-errors.types";
import type { AppointmentRequestValues } from "../types/appointment-request-values.types";
import type { AvailabilityBlock } from "../types/availability-block.types";
import { formatBlockDate } from "./block-selection.utils";

export function validateAppointmentRequest({
  orientationTypeId,
  message,
}: AppointmentRequestValues): AppointmentRequestErrors {
  const errors: AppointmentRequestErrors = {};
  if (!orientationTypeId) errors.orientationTypeId = REQUEST_APPOINTMENT_TEXT.missingTopic;
  if (message.trim().length > APPOINTMENT_MESSAGE_MAX_LENGTH) {
    errors.message = REQUEST_APPOINTMENT_TEXT.messageTooLong;
  }
  return errors;
}

export const formatAppointmentSchedule = ({ startAt, endAt }: AvailabilityBlock): string =>
  `${formatBlockDate(startAt)}, ${formatBlockRange(startAt, endAt)} · ${BOLIVIA_TIME_LABEL}`;
