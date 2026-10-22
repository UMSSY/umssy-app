import Image from "next/image";
import { cn } from "@/lib/utils";
import { getWorkshopCover } from "../utils/get-workshop-cover";
import type { WorkshopCoverProps } from "../types/workshop-cover-props.types";

export function WorkshopCover({ eventId, className }: WorkshopCoverProps) {
  return <div className={cn("relative aspect-workshop-cover overflow-hidden bg-interaction", className)}><Image src={getWorkshopCover(eventId)} alt="" fill sizes="(min-width: 1280px) 360px, 480px" className="object-cover" /></div>;
}
