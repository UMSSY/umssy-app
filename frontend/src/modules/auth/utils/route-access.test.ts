import { describe, expect, it } from "vitest";
import { isPublicPath } from "./route-access";

describe("route-access", () => {
  it("permite visitar invitado y registro sin sesion", () => {
    expect(isPublicPath("/guest")).toBe(true);
    expect(isPublicPath("/register")).toBe(true);
    expect(isPublicPath("/guest-falso")).toBe(false);
  });
  it.each(["/login", "/request-access", "/request-access/estado", "/sidebar-preview"])("%s es pública", (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each(["/", "/profile", "/events", "/events/my-passes", "/backoffice/solicitudes", "/login-falso", "/request-accessx"])("%s no es pública", (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});
