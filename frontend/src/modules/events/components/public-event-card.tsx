import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { formatEventDate } from "../utils/event-card";
import { WorkshopCover } from "./workshop-cover";
import type { PublicEventCardProps } from "../types/public-event-card-props.types";
export function PublicEventCard({ event, showCover = false }: PublicEventCardProps) {
  return <article className="flex flex-col rounded-lg border border-border bg-surface p-6">{showCover ? <WorkshopCover eventId={event.id} className="-mx-6 -mt-6 mb-6 rounded-t-lg" /> : null}<p className="text-sm font-medium text-accent">{event.category.name}</p><h3 className="mt-2 mb-5 text-xl font-bold text-ink"><Link href={`/workshops/${encodeURIComponent(event.id)}`} className="hover:text-accent">{event.title}</Link></h3><div className="mt-auto space-y-2 text-sm text-text-secondary"><p className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0" aria-hidden="true" />{formatEventDate(event.eventDate)}</p><p className="flex items-center gap-2"><MapPin className="size-4 shrink-0" aria-hidden="true" />{event.location?.trim() || "Lugar por confirmar"}</p></div><Link href={`/workshops/${encodeURIComponent(event.id)}`} className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm font-semibold text-accent">Ver taller<ArrowUpRight className="size-4" aria-hidden="true" /></Link></article>;
}
