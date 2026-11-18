import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  registerServiceWorker,
  unregisterServiceWorkers,
} from "@/shared/services/service-worker/service-worker-registration";
import { RegisterServiceWorker } from "./register-service-worker";

vi.mock("@/shared/services/service-worker/service-worker-registration", () => ({
  registerServiceWorker: vi.fn().mockResolvedValue(undefined),
  unregisterServiceWorkers: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it("registers the service worker only in production", () => {
  vi.stubEnv("NODE_ENV", "production");
  const { container } = render(<RegisterServiceWorker />);
  expect(registerServiceWorker).toHaveBeenCalledOnce();
  expect(unregisterServiceWorkers).not.toHaveBeenCalled();
  expect(container).toBeEmptyDOMElement();
});

it("removes previous workers and caches outside production", () => {
  vi.stubEnv("NODE_ENV", "development");
  render(<RegisterServiceWorker />);
  expect(unregisterServiceWorkers).toHaveBeenCalledOnce();
  expect(registerServiceWorker).not.toHaveBeenCalled();
});

it("ignores cleanup failures outside production", async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.mocked(unregisterServiceWorkers).mockRejectedValueOnce(new Error("denied"));
  render(<RegisterServiceWorker />);
  await Promise.resolve();
  expect(unregisterServiceWorkers).toHaveBeenCalledOnce();
});
