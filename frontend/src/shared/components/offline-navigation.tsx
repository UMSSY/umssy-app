'use client';

import { useEffect } from 'react';
import {
  BEFORE_OFFLINE_NAVIGATION,
  openOfflineRoute,
} from '@/shared/services/offline-navigation';
import { useOnlineStatus } from '@/modules/events/hooks/use-online-status';

export function OfflineNavigation() {
  const online = useOnlineStatus();
  useEffect(() => {
    const navigate = (event: MouseEvent) => {
      if (
        navigator.onLine ||
        event.defaultPrevented ||
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
      const permission = new CustomEvent(BEFORE_OFFLINE_NAVIGATION, {
        cancelable: true,
        detail: url.pathname + url.search + url.hash,
      });
      if (window.dispatchEvent(permission)) void openOfflineRoute(url.href);
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
