import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  collectLoadedAssetUrls,
  registerServiceWorker,
  unregisterServiceWorkers,
} from "./service-worker-registration";

const origin = window.location.origin;

function stubServiceWorker(overrides: Partial<ServiceWorkerContainer> = {}) {
  const postMessage = vi.fn();
  const container = {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({ active: { postMessage } }),
    getRegistrations: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: container });
  return { container, postMessage };
}

function stubResources(names: string[]) {
  vi.stubGlobal("performance", {
    getEntriesByType: vi.fn().mockReturnValue(names.map((name) => ({ name }))),
  });
}

beforeEach(() => stubResources([]));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("collectLoadedAssetUrls", () => {
  it("keeps unique same-origin Next static assets only", () => {
    stubResources([
      `${origin}/_next/static/chunks/app.js`,
      `${origin}/_next/static/chunks/app.js`,
      `${origin}/_next/static/css/app.css`,
      `${origin}/api/event-registrations/mine`,
      "https://api.example.com/_next/static/chunks/other.js",
      `${origin}/_next/image?url=x`,
    ]);
    expect(collectLoadedAssetUrls()).toEqual([
      `${origin}/_next/static/chunks/app.js`,
      `${origin}/_next/static/css/app.css`,
    ]);
  });

  it("returns nothing when the performance API is unavailable", () => {
    vi.stubGlobal("performance", undefined);
    expect(collectLoadedAssetUrls()).toEqual([]);
  });
});

describe("registerServiceWorker", () => {
  it("registers without HTTP cache and sends the loaded assets", async () => {
    stubResources([`${origin}/_next/static/chunks/app.js`]);
    const { container, postMessage } = stubServiceWorker();
    await registerServiceWorker();
    expect(container.register).toHaveBeenCalledWith("/sw.js", { updateViaCache: "none" });
    expect(postMessage).toHaveBeenCalledWith({
      type: "CACHE_URLS",
      urls: [`${origin}/_next/static/chunks/app.js`],
    });
  });

  it("reports registration errors without throwing", async () => {
    const error = new Error("blocked");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    stubServiceWorker({ register: vi.fn().mockRejectedValue(error) });
    await expect(registerServiceWorker()).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith("Error al registrar el Service Worker:", error);
  });

  it("does nothing when service workers are unsupported", async () => {
    await expect(registerServiceWorker()).resolves.toBeUndefined();
  });
});

describe("unregisterServiceWorkers", () => {
  it("unregisters workers and deletes only UMSSY caches", async () => {
    const unregister = vi.fn().mockResolvedValue(true);
    stubServiceWorker({ getRegistrations: vi.fn().mockResolvedValue([{ unregister }, { unregister }]) });
    const cacheStorage = {
      keys: vi.fn().mockResolvedValue(["umssy-shell-v1", "umssy-assets-v1", "third-party"]),
      delete: vi.fn().mockResolvedValue(true),
    };
    vi.stubGlobal("caches", cacheStorage);
    await unregisterServiceWorkers();
    expect(unregister).toHaveBeenCalledTimes(2);
    expect(cacheStorage.delete.mock.calls).toEqual([["umssy-shell-v1"], ["umssy-assets-v1"]]);
  });

  it("skips missing service worker and cache APIs", async () => {
    vi.stubGlobal("caches", undefined);
    await expect(unregisterServiceWorkers()).resolves.toBeUndefined();
  });
});
