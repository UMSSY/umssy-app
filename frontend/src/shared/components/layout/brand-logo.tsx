import Image from "next/image";
import { cn } from "cn";

import type { BrandLogoProps } from "@/shared/types/brand-logo-props.types";

export function BrandLogo({ className, priority = false, variant = "default" }: BrandLogoProps) {
  return (
    <Image
      src={variant === "on-dark" ? "/icons/umssy-logo-on-dark.svg" : "/icons/umssy-logo-web.svg"}
      alt="UMSSY, Acreditación y comunidad"
      width={1450}
      height={440}
      priority={priority}
      className={cn("h-auto w-60 shrink-0", className)}
    />
  );
}
