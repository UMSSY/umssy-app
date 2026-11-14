import { describe, expect, it } from "vitest";
import { isRetryableError } from "./is-retryable-error";

describe("isRetryableError", () => {
  it("retries when there is no connection or the failure is not an API error", () => {
    expect(isRetryableError({ isAxiosError: true })).toBe(true);
    expect(isRetryableError(new Error("Network Error"))).toBe(true);
  });

  it("retries when the server failed", () => {
    expect(isRetryableError({ isAxiosError: true, response: { status: 500 } })).toBe(true);
    expect(isRetryableError({ isAxiosError: true, response: { status: 503 } })).toBe(true);
  });

  it.each([400, 403, 404, 409])("does not retry when the server answered %s", (status) => {
    expect(isRetryableError({ isAxiosError: true, response: { status } })).toBe(false);
  });
});
