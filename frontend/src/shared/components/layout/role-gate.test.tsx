import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RoleGate } from "./role-gate";

afterEach(cleanup);

const ALLOWED_ROLES = ["administrativo"] as const;

describe("RoleGate", () => {
  it("muestra el contenido cuando el rol está permitido", () => {
    render(
      <RoleGate allowedRoles={ALLOWED_ROLES} currentRole="administrativo">
        <p>Contenido protegido</p>
      </RoleGate>,
    );

    expect(screen.getByText("Contenido protegido")).toBeTruthy();
  });

  it("muestra el aviso cuando el rol no está permitido", () => {
    render(
      <RoleGate allowedRoles={ALLOWED_ROLES} currentRole="titulado">
        <p>Contenido protegido</p>
      </RoleGate>,
    );

    expect(screen.queryByText("Contenido protegido")).toBeNull();
    expect(screen.getByText("Acceso restringido")).toBeTruthy();
  });

  it("muestra el aviso cuando no hay rol", () => {
    render(
      <RoleGate allowedRoles={ALLOWED_ROLES} currentRole={null}>
        <p>Contenido protegido</p>
      </RoleGate>,
    );

    expect(screen.getByText("Acceso restringido")).toBeTruthy();
  });

  it("muestra el estado de carga sin revelar el contenido", () => {
    render(
      <RoleGate allowedRoles={ALLOWED_ROLES} currentRole="administrativo" isLoading>
        <p>Contenido protegido</p>
      </RoleGate>,
    );

    expect(screen.getByText("Verificando permisos...")).toBeTruthy();
    expect(screen.queryByText("Contenido protegido")).toBeNull();
  });

  it("usa el aviso personalizado cuando se entrega", () => {
    render(
      <RoleGate
        allowedRoles={ALLOWED_ROLES}
        currentRole="mentor"
        forbiddenFallback={<p>Sin acceso personalizado</p>}
      >
        <p>Contenido protegido</p>
      </RoleGate>,
    );

    expect(screen.getByText("Sin acceso personalizado")).toBeTruthy();
  });
});