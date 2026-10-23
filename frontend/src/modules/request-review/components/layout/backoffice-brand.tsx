import Link from "next/link";
import { BrandLogo } from "@/shared/components/layout/brand-logo";

export function BackofficeBrand() {
  return <Link href="/dashboard" aria-label="UMSSY, ir al inicio" className="block shrink-0 outline-offset-4"><BrandLogo variant="on-dark" className="w-40" priority /></Link>;
}
