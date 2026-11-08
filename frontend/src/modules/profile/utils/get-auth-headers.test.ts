import "@/shared/testing/indexed-db.mock";
import { saveAccessToken, clearAccessToken } from "@/shared/services/storage/access-token-storage";
import { afterEach, describe, expect, it } from "vitest";

import { getAuthHeaders } from "./get-auth-headers";

describe("getAuthHeaders", () => {
  afterEach(() => {
    clearAccessToken();
  });

  it("sends the saved access token as a bearer token", async () => {
    await saveAccessToken("token-123");

    expect(getAuthHeaders()).toEqual({ Authorization: "Bearer token-123" });
  });

  it("sends no headers when there is no saved token", () => {
    expect(getAuthHeaders()).toEqual({});
  });
});
