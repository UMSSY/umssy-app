import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAuth } from "@/shared/contexts/auth-context";
import { useCurrentCompany } from "./use-current-company";

vi.mock("@/shared/contexts/auth-context", () => ({ useAuth: vi.fn() }));

import type { AuthContextValue } from "@/shared/types/auth-context-value.types";

const session: AuthContextValue = {
  currentUserId: "user-1",
  isLoading: false,
  refreshRoles: vi.fn(),
  roles: ["empresa"],
  company: { id: "real-company", name: "Empresa real" },
};

describe("useCurrentCompany", () => {
  it("uses the relationship returned by the authenticated session", () => {
    vi.mocked(useAuth).mockReturnValue(session);
    expect(renderHook(() => useCurrentCompany()).result.current.id).toBe(
      "real-company",
    );
  });
  it("does not associate a company for an unrelated role", () => {
    vi.mocked(useAuth).mockReturnValue({ ...session, roles: ["titulado"] });
    expect(renderHook(() => useCurrentCompany()).result.current.id).toBeNull();
  });
  it("does not use a demo company when the session has no relationship", () => {
    vi.mocked(useAuth).mockReturnValue({ ...session, company: null });
    expect(renderHook(() => useCurrentCompany()).result.current.id).toBeNull();
  });
});
