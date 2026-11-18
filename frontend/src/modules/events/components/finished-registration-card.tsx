import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, Check, Clock, MapPin } from "lucide-react";
import type { FinishedRegistrationItem } from "../types/finished-registration-item.types";
import { formatTimeRange } from "../utils/event-card";
import { formatRegistrationDate, getFinishedRegistrationPresentation } from "../utils/registration-format";

export function FinishedRegistrationCard({ registration }: { registration: FinishedRegistrationItem }) {
  const presentation = getFinishedRegistrationPresentation();
  return (
    <Card className="flex h-full min-w-0 flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <Badge variant="secondary"><Check aria-hidden="true" />{presentation.label}</Badge>
      <h3 className="line-clamp-2 text-lg font-bold break-words" title={registration.title}>{registration.title}</h3>
      <div className="space-y-2 text-sm text-text-secondary">
        <p className="flex items-center gap-2"><Calendar className="size-4 shrink-0" aria-hidden="true" />{formatRegistrationDate(registration.date)}</p>
        <p className="flex items-center gap-2"><Clock className="size-4 shrink-0" aria-hidden="true" />{formatTimeRange(registration.startTime, registration.endTime)}</p>
        <p className="flex items-center gap-2"><MapPin className="size-4 shrink-0" aria-hidden="true" />{registration.location?.trim() || "Ubicación no especificada"}</p>
      </div>
      <p className="mt-auto min-w-0 text-xs"><span className="font-semibold">ID Inscripción: </span><span className="break-all" title={registration.id}>{registration.id}</span></p>
    </Card>
  );
}
