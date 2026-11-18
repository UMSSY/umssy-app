import { describe, expect, it } from "vitest";
import { getTokenUserId } from "./get-token-user-id";

const token = (payload: unknown) => `h.${btoa(JSON.stringify(payload))}.s`;

describe("getTokenUserId", () => {
  it("reads the user id from the JWT subject", () => {
    expect(getTokenUserId(token({ sub: "user-1", roles: ["titulado"] }))).toBe("user-1");
  });

  it("decodes base64url payloads", () => {
    const payload = btoa(JSON.stringify({ sub: "ñandú?>" })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(getTokenUserId(`h.${payload}.s`)).toBe("ñandú?>");
  });

  it.each([
    ["no token", null],
    ["no payload", "header"],
    ["invalid json", "h.not-json.s"],
    ["non-object payload", token("user-1")],
    ["missing subject", token({ roles: ["titulado"] })],
    ["blank subject", token({ sub: "  " })],
    ["numeric subject", token({ sub: 42 })],
  ])("returns null for %s", (_, value) => {
    expect(getTokenUserId(value)).toBeNull();
  });
});
