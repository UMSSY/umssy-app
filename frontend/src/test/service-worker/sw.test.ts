// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";

type RequestLike = string | { url: string };
type Listener = (event: Record<string, unknown>) => void;
type Route = () => Response;

const ORIGIN = "https://umssy.test";
const SHELL = "umssy-shell-v1";
const ASSETS = "umssy-assets-v1";
const source = readFileSync(path.resolve(import.meta.dirname, "../../../public/sw.js"), "utf8");

const keyOf = (input: RequestLike) =>
  new URL(typeof input === "string" ? input : input.url, ORIGIN).href;

class FakeCache {
  entries = new Map<string, Response>();
  async match(input: RequestLike) {
    return this.entries.get(keyOf(input))?.clone();
  }
  async put(input: RequestLike, response: Response) {
    this.entries.set(keyOf(input), response);
  }
}

class FakeCacheStorage {
  stores = new Map<string, FakeCache>();
  async open(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new FakeCache());
    return this.stores.get(name)!;
  }
  async keys() {
    return [...this.stores.keys()];
  }
  async delete(name: string) {
    return this.stores.delete(name);
  }
  async match(input: RequestLike, options: { cacheName?: string } = {}) {
    const stores = options.cacheName
      ? [this.stores.get(options.cacheName)]
      : [...this.stores.values()];
    for (const store of stores) {
      const hit = await store?.match(input);
      if (hit) return hit;
    }
    return undefined;
  }
  cachedUrls(name: string) {
    return [...(this.stores.get(name)?.entries.keys() ?? [])].map((url) => url.replace(ORIGIN, ""));
  }
}

class SwRequest extends Request {
  constructor(input: RequestInfo, init?: RequestInit) {
    super(typeof input === "string" ? new URL(input, ORIGIN).href : input, init);
  }
}

const html = (body: string, cacheControl = "s-maxage=31536000") =>
  () => new Response(body, { headers: { "Content-Type": "text/html", "Cache-Control": cacheControl } });
const asset = (body = "asset", headers: Record<string, string> = {}) =>
  () => new Response(body, { headers });
const patched = (property: "redirected" | "type", value: unknown): Response => {
  const response = new Response("x");
  Object.defineProperty(response, property, { value });
  Object.defineProperty(response, "clone", { value: () => patched(property, value) });
  return response;
};
const withProperty = (property: "redirected" | "type", value: unknown) => () => patched(property, value);

function loadWorker(routes: Record<string, Route> = {}) {
  const listeners = new Map<string, Listener>();
  const caches = new FakeCacheStorage();
  const fetch = vi.fn(async (input: RequestLike) => {
    const url = new URL(keyOf(input));
    const route = routes[`${url.pathname}${url.search}`];
    if (!route || url.origin !== ORIGIN) throw new TypeError("Failed to fetch");
    return route();
  });
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn().mockResolvedValue(undefined) },
  };
  vm.runInContext(
    source,
    vm.createContext({
      self,
      caches,
      fetch,
      Request: SwRequest,
      Response,
      URL,
      setTimeout: (handler: () => void, ms: number) => setTimeout(handler, ms),
      clearTimeout: (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer),
    }),
  );

  async function dispatch(type: string, extra: Record<string, unknown> = {}) {
    const waits: Promise<unknown>[] = [];
    let response: Promise<Response> | undefined;
    const event = {
      ...extra,
      waitUntil: (promise: Promise<unknown>) => waits.push(promise),
      respondWith: (promise: Promise<Response>) => {
        response = promise;
      },
    };
    listeners.get(type)!(event);
    const result = response ? await response : undefined;
    let settled = 0;
    while (settled < waits.length) {
      settled = waits.length;
      await Promise.allSettled(waits);
    }
    return { responded: response !== undefined, response: result, waits };
  }

  const request = (url: string, init: { method?: string; mode?: string; headers?: Record<string, string> } = {}) => ({
    url: new URL(url, ORIGIN).href,
    method: init.method ?? "GET",
    mode: init.mode ?? "cors",
    headers: new Headers(init.headers),
  });

  return {
    caches,
    fetch,
    self,
    install: () => dispatch("install"),
    activate: () => dispatch("activate"),
    message: (data: unknown) => dispatch("message", { data }),
    get: (url: string, init?: Parameters<typeof request>[1]) => dispatch("fetch", { request: request(url, init) }),
    navigate: (url: string) => dispatch("fetch", { request: request(url, { mode: "navigate" }) }),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("service worker fetch routing", () => {
  it.each([
    ["API routes", "/api/event-registrations/mine", {}],
    ["cross-origin API", "https://api.umssy.test/event-registrations/mine", {}],
    ["non-GET requests", "/_next/static/chunks/app.js", { method: "POST" }],
    ["image optimizer", "/_next/image?url=%2Fimages%2Fa.webp&w=640&q=75", {}],
    ["RSC header", "/events/my-passes", { headers: { RSC: "1" } }],
    ["RSC query", "/events/my-passes?_rsc=abc", {}],
    ["other public files", "/images/campus-fcyt.webp", {}],
  ])("passes %s straight to the network", async (_, url, init) => {
    const worker = loadWorker();
    const result = await worker.get(url, init);
    expect(result.responded).toBe(false);
    expect(worker.fetch).not.toHaveBeenCalled();
  });

  it("serves Next static assets cache-first", async () => {
    const worker = loadWorker({ "/_next/static/chunks/app.js": asset("console.log(1)") });
    await worker.get("/_next/static/chunks/app.js");
    const second = await worker.get("/_next/static/chunks/app.js");
    expect(await second.response!.text()).toBe("console.log(1)");
    expect(worker.fetch).toHaveBeenCalledOnce();
  });

  it.each([
    ["non-OK", () => new Response("missing", { status: 404 })],
    ["redirected", withProperty("redirected", true)],
    ["opaque redirect", withProperty("type", "opaqueredirect")],
    ["private", asset("x", { "Cache-Control": "private, max-age=60" })],
    ["no-store", asset("x", { "Cache-Control": "no-store" })],
  ])("does not cache %s responses", async (_, route) => {
    const worker = loadWorker({ "/_next/static/chunks/app.js": route });
    await worker.get("/_next/static/chunks/app.js");
    expect(worker.caches.cachedUrls(ASSETS)).toEqual([]);
  });

  it("serves icons stale-while-revalidate and refreshes them", async () => {
    let version = "old";
    const worker = loadWorker({ "/icons/icon-umssy.svg": () => new Response(version) });
    await worker.get("/icons/icon-umssy.svg");
    version = "new";
    const stale = await worker.get("/icons/icon-umssy.svg");
    expect(await stale.response!.text()).toBe("old");
    const fresh = await worker.get("/icons/icon-umssy.svg");
    expect(await fresh.response!.text()).toBe("new");
  });

  it("returns the network response for icons without a cached copy", async () => {
    const worker = loadWorker({ "/manifest.json": asset("{}") });
    const result = await worker.get("/manifest.json");
    expect(await result.response!.text()).toBe("{}");
  });
});

describe("service worker navigations", () => {
  it("caches allowed static routes and never other navigations", async () => {
    const worker = loadWorker({
      "/events/my-passes/": html("passes shell"),
      "/chat": html("chat"),
      "/dashboard": html("private dashboard", "private, no-cache, no-store, max-age=0, must-revalidate"),
    });
    await worker.navigate("/events/my-passes/");
    await worker.navigate("/chat");
    await worker.navigate("/dashboard");
    expect(worker.caches.cachedUrls(SHELL)).toEqual(["/events/my-passes"]);
  });

  it("falls back to the cached route and then to offline.html without network", async () => {
    const worker = loadWorker();
    const shell = await worker.caches.open(SHELL);
    await shell.put("/events/my-passes", html("cached passes")());
    await shell.put("/offline.html", html("offline page")());

    const cached = await worker.navigate("/events/my-passes?tab=1");
    expect(await cached.response!.text()).toBe("cached passes");
    const fallback = await worker.navigate("/chat");
    expect(await fallback.response!.text()).toBe("offline page");
  });

  it("returns a network error when nothing is cached", async () => {
    const worker = loadWorker();
    const result = await worker.navigate("/events/my-passes");
    expect(result.response!.type).toBe("error");
  });

  it("uses the cached route when the network exceeds the timeout", async () => {
    vi.useFakeTimers();
    const worker = loadWorker();
    worker.fetch.mockImplementation(
      () => new Promise<Response>((resolve) => setTimeout(() => resolve(html("fresh dashboard")()), 10000)),
    );
    const shell = await worker.caches.open(SHELL);
    await shell.put("/dashboard", html("cached dashboard")());

    const pending = worker.navigate("/dashboard");
    await vi.advanceTimersByTimeAsync(10000);
    const result = await pending;
    expect(await result.response!.text()).toBe("cached dashboard");
    expect(await (await shell.match("/dashboard"))!.text()).toBe("fresh dashboard");
  });

  it("keeps waiting for slow routes without a cached copy", async () => {
    vi.useFakeTimers();
    let resolveNetwork: (response: Response) => void = () => undefined;
    const worker = loadWorker();
    worker.fetch.mockImplementation(() => new Promise<Response>((resolve) => { resolveNetwork = resolve; }));
    const pending = worker.navigate("/chat");
    await vi.advanceTimersByTimeAsync(4000);
    resolveNetwork(html("late chat")());
    const result = await pending;
    expect(await result.response!.text()).toBe("late chat");
  });
});

describe("service worker lifecycle", () => {
  const shellHtml = [
    '<link rel="stylesheet" href="/_next/static/css/app.css">',
    '<script src="/_next/static/chunks/main.js"></script>',
    '<script>self.__next_f.push([1,"\\"/_next/static/chunks/page.js\\""])</script>',
  ].join("");

  it("precaches the offline page, icons, static routes and their assets", async () => {
    const routes: Record<string, Route> = {
      "/offline.html": html("offline"),
      "/": html(shellHtml),
      "/events/my-passes": html(shellHtml),
      "/dashboard": html(shellHtml),
      "/events": html("dynamic", "private, no-cache, no-store, max-age=0, must-revalidate"),
      "/manifest.json": asset("{}"),
      "/_next/static/css/app.css": asset("css"),
      "/_next/static/chunks/main.js": asset("main"),
      "/_next/static/chunks/page.js": asset("page"),
    };
    const worker = loadWorker(routes);
    await worker.install();

    expect(worker.self.skipWaiting).toHaveBeenCalled();
    expect(worker.caches.cachedUrls(SHELL)).toEqual(
      expect.arrayContaining(["/offline.html", "/manifest.json", "/", "/events/my-passes", "/dashboard"]),
    );
    expect(worker.caches.cachedUrls(SHELL)).not.toContain("/events");
    expect(worker.caches.cachedUrls(ASSETS).sort()).toEqual([
      "/_next/static/chunks/main.js",
      "/_next/static/chunks/page.js",
      "/_next/static/css/app.css",
    ]);
    expect(worker.fetch.mock.calls.filter(([input]) => keyOf(input).endsWith("main.js"))).toHaveLength(1);
  });

  it("fails the install when the offline fallback cannot be cached", async () => {
    const worker = loadWorker({ "/offline.html": () => new Response("x", { status: 500 }) });
    const result = await worker.install();
    await expect(result.waits[0]).rejects.toThrow("offline fallback could not be cached");
  });

  it("deletes caches from other versions and claims clients", async () => {
    const worker = loadWorker();
    for (const name of ["umssy-shell-v0", "umssy-assets-v0", SHELL, ASSETS, "third-party"]) {
      await worker.caches.open(name);
    }
    await worker.activate();
    expect(await worker.caches.keys()).toEqual([SHELL, ASSETS, "third-party"]);
    expect(worker.self.clients.claim).toHaveBeenCalled();
  });

  it("caches only same-origin Next assets sent by the page", async () => {
    const worker = loadWorker({
      "/_next/static/chunks/app.js": asset("app"),
      "/api/me": asset("secret"),
    });
    await worker.message({
      type: "CACHE_URLS",
      urls: [
        `${ORIGIN}/_next/static/chunks/app.js`,
        `${ORIGIN}/api/me`,
        "https://cdn.example.com/_next/static/chunks/x.js",
        `${ORIGIN}/_next/static/chunks/app.js?_rsc=1`,
        42,
      ],
    });
    expect(worker.caches.cachedUrls(ASSETS)).toEqual(["/_next/static/chunks/app.js"]);
  });

  it("ignores unrelated messages", async () => {
    const worker = loadWorker();
    const result = await worker.message({ type: "OTHER" });
    expect(result.waits).toHaveLength(0);
  });
});
