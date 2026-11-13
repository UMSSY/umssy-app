import {
  NEXT_STATIC_ASSETS_PREFIX,
  SERVICE_WORKER_CACHE_PREFIX,
  SERVICE_WORKER_CACHE_URLS_MESSAGE,
  SERVICE_WORKER_URL,
} from "@/shared/constants/service-worker.constants";

const supportsServiceWorker = () =>
  typeof navigator !== "undefined" && "serviceWorker" in navigator;

export function collectLoadedAssetUrls(): string[] {
  if (typeof performance === "undefined" || !performance.getEntriesByType) return [];
  const urls = performance
    .getEntriesByType("resource")
    .map(({ name }) => new URL(name, window.location.origin))
    .filter(
      (url) =>
        url.origin === window.location.origin &&
        url.pathname.startsWith(NEXT_STATIC_ASSETS_PREFIX),
    )
    .map((url) => url.href);
  return [...new Set(urls)];
}

export async function registerServiceWorker(): Promise<void> {
  if (!supportsServiceWorker()) return;
  try {
    await navigator.serviceWorker.register(SERVICE_WORKER_URL, { updateViaCache: "none" });
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: SERVICE_WORKER_CACHE_URLS_MESSAGE,
      urls: collectLoadedAssetUrls(),
    });
  } catch (error) {
    console.error("Error al registrar el Service Worker:", error);
  }
}

export async function unregisterServiceWorkers(): Promise<void> {
  if (supportsServiceWorker()) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if (typeof caches === "undefined") return;
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => name.startsWith(SERVICE_WORKER_CACHE_PREFIX))
      .map((name) => caches.delete(name)),
  );
}
