import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RoleTag } from "@/shared/types/role-tag.types";
import { MentorAccessFallback } from "./mentor-access-fallback";

const session = vi.hoisted(() => ({ roles: [] as RoleTag[] }));
vi.mock("@/shared/contexts/auth-context", () => ({ useAuth: () => session }));

describe("MentorAccessFallback", () => {
  afterEach(cleanup);

  it.each<RoleTag>(["titulado", "mentor"])("conserva los caminos de participación para %s", (role) => {
    session.roles = [role];
    render(<MentorAccessFallback />);
    expect(screen.getByRole("alert")).toHaveTextContent("participación activa");
    expect(screen.getByRole("link", { name: "Revisar mi participación" })).toHaveAttribute("href", "/mentors/participation");
    expect(screen.getByRole("link", { name: "Iniciar incorporación" })).toHaveAttribute("href", "/mentorship");
  });

  it.each<RoleTag>(["estudiante", "empresa", "administrativo"])("oculta enlaces protegidos para %s", (role) => {
    session.roles = [role];
    render(<MentorAccessFallback />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
