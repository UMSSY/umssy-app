'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

interface InstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
}

const InstallContext = createContext<{
  install: (() => void) | null;
  installed: boolean;
}>({ install: null, installed: true });

const standaloneQuery = '(display-mode: standalone)';

function subscribeToDisplayMode(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {};
  const mode = window.matchMedia(standaloneQuery);
  mode.addEventListener('change', onChange);
  return () => mode.removeEventListener('change', onChange);
}

const isStandalone = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia(standaloneQuery).matches;

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const standalone = useSyncExternalStore(
    subscribeToDisplayMode,
    isStandalone,
    () => true,
  );
  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setPending(event as InstallPromptEvent);
    };
    const markInstalled = () => {
      setInstalled(true);
      setPending(null);
    };
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', markInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', capture);
      window.removeEventListener('appinstalled', markInstalled);
    };
  }, []);
  const install = pending
    ? () => {
        setPending(null);
        void pending.prompt().catch(() => {});
      }
    : null;

  return (
    <InstallContext.Provider
      value={{ install, installed: installed || standalone }}
    >
      {children}
    </InstallContext.Provider>
  );
}

export const usePwaInstall = () => useContext(InstallContext);
