import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBlockRange, toBoliviaTime } from "@/shared/utils/date-time";
import { BLOCK_APPOINTMENT_DETAIL_TEXT } from "../constants/block-appointment-detail.constants";
import type { BlockAppointmentDetailProps } from "../types/block-appointment-detail-props.types";
import { formatLongDate } from "../utils/calendar-date";

export function BlockAppointmentDetail({ block, appointment }: BlockAppointmentDetailProps) {
  return (
    <Card aria-label={BLOCK_APPOINTMENT_DETAIL_TEXT.title} className="w-full rounded-lg border border-border bg-surface shadow-none">
      <CardHeader>
        <CardTitle>{BLOCK_APPOINTMENT_DETAIL_TEXT.title}</CardTitle>
        <CardDescription>
          {formatLongDate(toBoliviaTime(block.startAt).date)} · {formatBlockRange(block.startAt, block.endAt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-text-secondary">{BLOCK_APPOINTMENT_DETAIL_TEXT.bookedBy}</dt>
            <dd className="font-medium wrap-anywhere">{appointment.counterpart.fullName}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">{BLOCK_APPOINTMENT_DETAIL_TEXT.topic}</dt>
            <dd className="font-medium">
              {appointment.orientationType?.name ?? BLOCK_APPOINTMENT_DETAIL_TEXT.noTopic}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
