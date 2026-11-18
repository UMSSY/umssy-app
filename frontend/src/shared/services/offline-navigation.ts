import { toast } from 'sonner';

export const BEFORE_OFFLINE_NAVIGATION = 'umssy:before-offline-navigation';

export async function openOfflineRoute(href: string): Promise<void> {
  const url = new URL(href, window.location.href);
  try {
    const cached =
      typeof caches !== 'undefined' &&
      (await caches.match(url.origin + url.pathname));
    if (url.origin === location.origin && cached) location.assign(url.href);
    else toast.info('Conéctate para abrir esta sección.');
  } catch {
    toast.info('Conéctate para abrir esta sección.');
  }
}
