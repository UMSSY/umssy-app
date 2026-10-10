import { describe, expect, it } from "vitest";
import { isOfflinePath, isOpenPath, isPublicPath } from "./route-access";

describe("route-access", () => {
  it.each(["/login", "/request-access", "/request-access/estado", "/sidebar-preview"])("%s es pública", (path) => {
    expect(isPublicPath(path)).toBe(true);
    expect(isOpenPath(path)).toBe(true);
  });

  it.each(["/", "/profile", "/events", "/backoffice/solicitudes", "/login-falso", "/request-accessx"])("%s no es pública", (path) => {
    expect(isPublicPath(path)).toBe(false);
    expect(isOpenPath(path)).toBe(false);
  });

  it("Mis pases es la ruta de uso sin conexión y queda abierta", () => {
    expect(isOfflinePath("/events/my-passes")).toBe(true);
    expect(isOfflinePath("/events")).toBe(false);
    expect(isOpenPath("/events/my-passes")).toBe(true);
  });
});
