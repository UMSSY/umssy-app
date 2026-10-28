import Image from "next/image";
import { ENV_CONFIG } from '@/shared/config/env.config';
import { cn } from "@/lib/utils";
import { getWorkshopCover } from "../utils/get-workshop-cover";
import type { WorkshopCoverProps } from "../types/workshop-cover-props.types";

export function WorkshopCover({ eventId, coverUrl, className }: WorkshopCoverProps) {
  const source = coverUrl?.startsWith('/events/') ? `${ENV_CONFIG.apiUrl?.replace(/\/$/, '')}${coverUrl}` : getWorkshopCover(eventId);
  return <div className={cn("relative aspect-workshop-cover overflow-hidden bg-interaction", className)}><Image src={source} unoptimized={Boolean(coverUrl)} alt="" fill sizes="(min-width: 1280px) 360px, 480px" className="object-cover" /></div>;
}
