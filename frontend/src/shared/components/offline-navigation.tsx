'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useOnlineStatus } from '@/modules/events/hooks/use-online-status';

export function OfflineNavigation() {
  const online = useOnlineStatus();
  useEffect(() => {
    const navigate = (event: MouseEvent) => {
      if (
        navigator.onLine ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element).closest?.(
        'a[href]',
      ) as HTMLAnchorElement | null;
      if (
        !anchor ||
        anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self')
      )
        return;
      const url = new URL(anchor.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search)
        return;
      event.preventDefault();
      event.stopPropagation();
      void (async () => {
        const cached =
          typeof caches !== 'undefined' &&
          (await caches.match(url.origin + url.pathname));
        if (cached) location.assign(url.href);
        else toast.info('Conéctate para abrir esta sección.');
      })().catch(() => toast.info('Conéctate para abrir esta sección.'));
    };
    document.addEventListener('click', navigate, true);
    return () => document.removeEventListener('click', navigate, true);
  }, []);
  return online ? null : (
    <div
      role="status"
      className="bg-interaction px-4 py-2 text-center text-sm text-ink"
    >
      Sin conexión. Puedes consultar lo guardado.
    </div>
  );
}
