import Image from "next/image";
import { cn } from "@/lib/utils";
import type { InstitutionalSealProps } from "@/shared/types/institutional-seal-props.types";

export function InstitutionalSeal({ className }: InstitutionalSealProps) {
  return <Image src="/icons/umss-institutional-seal.svg" alt="Escudo de la Universidad Mayor de San Simón" width={137} height={208} className={cn("h-18 w-auto shrink-0", className)} />;
}
