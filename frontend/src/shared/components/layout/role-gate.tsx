"use client";

import { useAuth } from "@/shared/contexts/auth-context";
import type { RoleGateProps } from "@/shared/types/role-gate-props.types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";

export function RoleGate({ children, allowedRoles }: RoleGateProps) {
  const { roles, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) return <p role="status">Verificando permisos...</p>;
  if (!roles.some((role) => allowedRoles.includes(role))) {
    if (pathname?.replace(/\/$/, "") === "/mentors/participation/technical-areas") {
      return <div className="space-y-4 p-6"><p role="alert">Necesitas una participación activa como mentor para editar áreas técnicas.</p><Link href="/mentors/participation" className={buttonVariants({ variant: "outline" })}>Revisar mi participación</Link><Link href="/mentorship" className={buttonVariants()}>Iniciar incorporación</Link></div>;
    }
    return <p role="alert">No tienes permisos para acceder a esta sección.</p>;
  }

  return children;
}
