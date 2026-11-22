'use client';

import { useEffect, useState } from 'react';
import { BEFORE_OFFLINE_NAVIGATION } from '@/shared/services/offline-navigation';

const BEFORE_BUTTON_NAVIGATION = 'umssy:before-button-navigation';

export function requestGuardedNavigation(navigate: () => void): void {
  const event = new CustomEvent(BEFORE_BUTTON_NAVIGATION, {
    cancelable: true,
    detail: navigate,
  });
  if (window.dispatchEvent(event)) navigate();
}

function findInternalLink(
  target: EventTarget | null,
): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  const anchor = target.closest('a[href]');
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.target === '_blank' || anchor.hasAttribute('download'))
    return null;
  const url = new URL(anchor.href, window.location.href);
  if (
    url.origin !== window.location.origin ||
    url.pathname === window.location.pathname
  )
    return null;
  return anchor;
}

export function useUnsavedChangesGuard(isActive: boolean) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = findInternalLink(event.target);
      if (!anchor) return;
      event.preventDefault();
      event.stopPropagation();
      const url = new URL(anchor.href, window.location.href);
      setPendingHref(`${url.pathname}${url.search}${url.hash}`);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    const handleOfflineNavigation = (event: Event) => {
      event.preventDefault();
      setPendingHref((event as CustomEvent<string>).detail);
    };
    window.addEventListener(BEFORE_OFFLINE_NAVIGATION, handleOfflineNavigation);
    const handleButtonNavigation = (event: Event) => {
      const action = (event as CustomEvent<unknown>).detail;
      if (typeof action !== 'function') return;
      event.preventDefault();
      setPendingAction(() => action as () => void);
    };
    window.addEventListener(BEFORE_BUTTON_NAVIGATION, handleButtonNavigation);
    document.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener(
        BEFORE_OFFLINE_NAVIGATION,
        handleOfflineNavigation,
      );
      window.removeEventListener(
        BEFORE_BUTTON_NAVIGATION,
        handleButtonNavigation,
      );
      document.removeEventListener('click', handleClick, true);
    };
  }, [isActive]);

  return {
    pendingHref,
    clearPendingHref: () => setPendingHref(null),
    pendingAction,
    clearPendingAction: () => setPendingAction(null),
  };
}
