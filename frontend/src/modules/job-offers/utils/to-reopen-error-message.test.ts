import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { REOPEN_JOB_OFFER_TEXT } from "../constants/job-offers.constants";
import { toReopenErrorMessage } from "./to-reopen-error-message";

function responseError(status: number): AxiosError {
  return new AxiosError("fail", "ERR_BAD_RESPONSE", undefined, undefined, { status, data: {} } as AxiosResponse);
}

describe("toReopenErrorMessage", () => {
  it("explica que la vacante ya no está cerrada cuando el servidor responde 409", () => {
    expect(toReopenErrorMessage(responseError(409))).toBe(REOPEN_JOB_OFFER_TEXT.notReopenable);
  });

  it("usa el mensaje general ante un error del servidor o de red", () => {
    expect(toReopenErrorMessage(responseError(500))).toBe(REOPEN_JOB_OFFER_TEXT.error);
    expect(toReopenErrorMessage(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(
      REOPEN_JOB_OFFER_TEXT.error,
    );
    expect(toReopenErrorMessage(new Error("boom"))).toBe(REOPEN_JOB_OFFER_TEXT.error);
  });
});
