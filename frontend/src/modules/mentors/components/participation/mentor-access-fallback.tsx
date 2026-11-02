"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/shared/contexts/auth-context";
import { getRouteRoles } from "@/shared/utils/get-route-roles";

export function MentorAccessFallback() {
  const { roles } = useAuth();

  return (
    <div className="space-y-4 p-6">
      <p role="alert">Necesitas una participación activa como mentor para editar áreas técnicas.</p>
      {roles.some((role) => getRouteRoles("/mentors/participation").includes(role)) && (
        <Link href="/mentors/participation" className={buttonVariants({ variant: "outline" })}>
          Revisar mi participación
        </Link>
      )}
      {roles.some((role) => getRouteRoles("/mentorship").includes(role)) && (
        <Link href="/mentorship" className={buttonVariants()}>
          Iniciar incorporación
        </Link>
      )}
    </div>
  );
}
