import Image from "next/image";
import Link from "next/link";
import { InstitutionalSeal } from "./institutional-seal";
import { BrandLogo } from "./brand-logo";
export function SidebarBrandIcon() {
  return <Image src="/icons/umssy-simbolo-web.svg" alt="" width={48} height={48} className="size-12 shrink-0" aria-hidden="true" />;
}
export function SidebarBrand() {
  return <Link href="/dashboard" aria-label="UMSSY, ir al inicio" className="flex items-center gap-3 outline-offset-4"><InstitutionalSeal className="h-11" /><BrandLogo className="w-32" priority /></Link>;
}
