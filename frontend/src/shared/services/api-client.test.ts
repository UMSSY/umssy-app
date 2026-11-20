import * as authBroadcast from "@/shared/utils/auth-broadcast";
import "@/shared/testing/indexed-db.mock";
import axios, { type AxiosHeaders, type AxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./api-client";
import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from "./storage/access-token-storage";

afterEach(() => vi.restoreAllMocks());

async function captureRequestHeaders(config: AxiosRequestConfig = {}) {
  let headers: AxiosHeaders | undefined;

  await apiClient.get("/test", {
    ...config,
    adapter: async (requestConfig) => {
      headers = requestConfig.headers;
      return {
        data: null,
        status: 200,
        statusText: "OK",
        headers: {},
        config: requestConfig,
      };
    },
  });

  return headers;
}

describe("apiClient authorization", () => {
  afterEach(() => {
    clearAccessToken();
  });

  it('rejects offline mutations before sending them', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const adapter = vi.fn();
    await expect(
      apiClient.post('/events/test', {}, { adapter }),
    ).rejects.toThrow('Necesitas conexión');
    expect(adapter).not.toHaveBeenCalled();
  });

  it("configures withCredentials to true to transmit HttpOnly session cookies", () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it("adds a Bearer token when an access token exists", async () => {
    await saveAccessToken("stored-token");

    const headers = await captureRequestHeaders();

    expect(headers?.get("Authorization")).toBe("Bearer stored-token");
  });

  it("does not add Authorization when no access token exists", async () => {
    const headers = await captureRequestHeaders();

    expect(headers?.has("Authorization")).toBe(false);
  });

  it("preserves an explicitly supplied Authorization header", async () => {
    await saveAccessToken("stored-token");

    const headers = await captureRequestHeaders({
      headers: { Authorization: "Basic explicit-credentials" },
    });

    expect(headers?.get("Authorization")).toBe("Basic explicit-credentials");
  });
});

describe("apiClient session errors", () => {
  afterEach(clearAccessToken);

  function rejectWithStatus(status: number, tokenDuringResponse?: string) {
    return apiClient.get("/private-resource", {
      adapter: async (config) => {
        if (tokenDuringResponse) await saveAccessToken(tokenDuringResponse);
        throw Object.assign(new Error("Solicitud rechazada"), { isAxiosError: true, config, response: { status, data: { detail: "Solicitud rechazada" } } });
      },
    });
  }

  it("invalidates the current session on an authenticated 401 without a mounted guard", async () => {
    await saveAccessToken("expired-token");
    await expect(rejectWithStatus(401)).rejects.toThrow("Solicitud rechazada");
    expect(getAccessToken()).toBeNull();
  });

  it("does not invalidate a newer session when an old request returns 401", async () => {
    await saveAccessToken("old-token");
    await expect(rejectWithStatus(401, "new-token")).rejects.toThrow();
    expect(getAccessToken()).toBe("new-token");
  });

  it.each([400, 403, 404, 422, 500])(
    "preserves the session and original error on HTTP %s",
    async (status) => {
      await saveAccessToken("valid-token");
      await expect(rejectWithStatus(status)).rejects.toMatchObject({ response: { status, data: { detail: "Solicitud rechazada" } } });
      expect(getAccessToken()).toBe("valid-token");
    },
  );

  it("broadcasts SESSION_CLOSED when 401 response includes a session closure code (CA7, CA10)", async () => {
    const broadcastSpy = vi.spyOn(authBroadcast, "broadcastAuthEvent").mockImplementation(() => {});
    await saveAccessToken("expired-token");

    let rejected = false;
    try {
      await apiClient.get("/private-resource", {
        adapter: async (config) => {
          throw Object.assign(new Error("Revocado"), {
            isAxiosError: true,
            config,
            response: {
              status: 401,
              data: { code: "SESSION_REVOKED", detail: "Sesión revocada" },
            },
          });
        },
      });
    } catch {
      rejected = true;
    }

    expect(rejected).toBe(true);
    expect(broadcastSpy).toHaveBeenCalledWith({
      type: "SESSION_CLOSED",
      reason: "SESSION_REVOKED",
    });
    broadcastSpy.mockRestore();
  });

  it("retries request once after a successful token refresh on 401 without code", async () => {
    let callCount = 0;
    const postSpy = vi.spyOn(axios, "post").mockResolvedValueOnce({
      data: { ok: true, accessToken: "new-access-token" },
    });

    const response = await apiClient.get("/protected", {
      adapter: async (config) => {
        callCount++;
        if (callCount === 1) {
          throw Object.assign(new Error("Token expired"), {
            isAxiosError: true,
            config,
            response: { status: 401, data: {} },
          });
        }
        return {
          data: { success: true },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      },
    });

    expect(callCount).toBe(2);
    expect(response.data).toEqual({ success: true });
    expect(postSpy).toHaveBeenCalled();
    postSpy.mockRestore();
  });
});
