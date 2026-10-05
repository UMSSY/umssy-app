import type { ReactNode } from "react";
import { Lock } from "lucide-react";

interface RoleGateProps {
  allowedRoles: readonly string[];
  currentRole: string | null;
  isLoading?: boolean;
  forbiddenFallback?: ReactNode;
  children: ReactNode;
}

// Decide qué mostrar según el rol. No hace fetch: recibe todo por props.
export function RoleGate({
  allowedRoles,
  currentRole,
  isLoading = false,
  forbiddenFallback,
  children,
}: RoleGateProps) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-surface-soft text-sm text-text-secondary"
      >
        Verificando permisos...
      </div>
    );
  }

  const hasAccess = currentRole !== null && allowedRoles.includes(currentRole);

  if (!hasAccess) {
    return <>{forbiddenFallback ?? <DefaultForbidden />}</>;
  }

  return <>{children}</>;
}

function DefaultForbidden() {
  return (
    <div
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface-soft p-6 text-center"
    >
      <Lock className="size-8 text-danger" aria-hidden="true" />
      <h1 className="font-tight text-xl font-bold text-ink">Acceso restringido</h1>
      <p className="max-w-sm text-sm text-text-secondary">
        No tienes permiso para ver esta sección. Si crees que es un error, contacta al administrador.
      </p>
    </div>
  );
}