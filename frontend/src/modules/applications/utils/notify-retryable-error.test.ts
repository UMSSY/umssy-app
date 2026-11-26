import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { notifyRetryableError } from "./notify-retryable-error";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

afterEach(() => {
  vi.resetAllMocks();
});

describe("notifyRetryableError", () => {
  it("offers a Reintentar action when trying again can work", () => {
    const retry = vi.fn();

    notifyRetryableError({ isAxiosError: true }, "Sin conexión", retry);

    expect(toast.error).toHaveBeenCalledWith("Sin conexión", { action: { label: "Reintentar", onClick: retry } });
  });

  it("only shows the message when trying again cannot work", () => {
    notifyRetryableError({ isAxiosError: true, response: { status: 404 } }, "No existe", vi.fn());

    expect(toast.error).toHaveBeenCalledWith("No existe");
  });
});
