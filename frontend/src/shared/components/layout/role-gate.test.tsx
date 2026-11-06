import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoleTag } from "@/shared/types/role-tag.types";
import { getRouteRoles } from "@/shared/utils/get-route-roles";
import { RoleGate } from "./role-gate";

const session = vi.hoisted(() => ({ roles: [] as RoleTag[], isLoading: false }));
vi.mock("@/shared/contexts/auth-context", () => ({ useAuth: () => session }));

describe("RoleGate", () => {
  beforeEach(() => {
    session.roles = [];
    session.isLoading = false;
  });
  afterEach(cleanup);

  it.each<RoleTag>(["titulado", "estudiante", "mentor", "empresa", "administrativo"])(
    "respeta la configuración de acceso para %s", (role) => {
      session.roles = [role];
      render(
        <RoleGate allowedRoles={getRouteRoles("/mentors/participation/technical-areas")}>
          <p>Contenido protegido</p>
        </RoleGate>,
      );
      if (role === "mentor") expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
      else {
        expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent("No tienes permisos para acceder a esta sección.");
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
      }
    },
  );

  it("permite el acceso si coincide uno de los roles de la sesión", () => {
    session.roles = ["titulado", "mentor"];
    render(<RoleGate allowedRoles={["mentor"]} fallback={<p>Sin acceso</p>}>Contenido protegido</RoleGate>);
    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
    expect(screen.queryByText("Sin acceso")).not.toBeInTheDocument();
  });

  it("deniega rutas sin roles configurados", () => {
    session.roles = ["administrativo"];
    render(<RoleGate allowedRoles={[]}>Contenido protegido</RoleGate>);
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("muestra el fallback proporcionado sin exponer el contenido", () => {
    render(<RoleGate allowedRoles={["mentor"]} fallback={<p>Acceso personalizado</p>}>Contenido protegido</RoleGate>);
    expect(screen.getByText("Acceso personalizado")).toBeInTheDocument();
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("acepta un fallback nulo de forma explícita", () => {
    const { container } = render(<RoleGate allowedRoles={["mentor"]} fallback={null}>Contenido protegido</RoleGate>);
    expect(container).toBeEmptyDOMElement();
  });

  it("espera la sesión antes de mostrar contenido o fallback", () => {
    session.roles = ["mentor"];
    session.isLoading = true;
    render(<RoleGate allowedRoles={["mentor"]} fallback={<p>Sin acceso</p>}>Contenido protegido</RoleGate>);
    expect(screen.getByRole("status")).toHaveTextContent("Verificando permisos");
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
    expect(screen.queryByText("Sin acceso")).not.toBeInTheDocument();
  });
});
