import { describe, expect, it } from "vitest";
import { parseApiError } from "./parse-api-error";

const body = { statusCode: 409, ok: false, code: "EVENT_FULL", detail: "Sin cupos", data: null };
const axiosError = (data: unknown, status = 409) => ({ isAxiosError: true, response: { status, data } });

describe("parseApiError", () => {
  it("extracts a typed error without depending on detail wording", () => {
    expect(parseApiError(axiosError(body))).toEqual(body);
  });

  it.each([
    null, new Error("network"), { response: { status: 409, data: body } },
    { isAxiosError: true }, axiosError(null), axiosError("error"),
    axiosError({ ...body, statusCode: 200 }), axiosError({ ...body, statusCode: 600 }),
    axiosError({ ...body, statusCode: "409" }), axiosError({ ...body, statusCode: 409.5 }),
    axiosError(body, 500), axiosError({ ...body, ok: true }),
    axiosError({ ...body, data: [] }), axiosError({ ...body, code: " " }),
    axiosError({ ...body, code: 12 }), axiosError({ ...body, detail: null }),
    axiosError({}), axiosError({ statusCode: 409 }),
  ])("rejects an absent or malformed envelope: %j", (error) => {
    expect(parseApiError(error)).toBeNull();
  });
});
