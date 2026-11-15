'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface InstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
}

const InstallContext = createContext<(() => void) | null>(null);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<InstallPromptEvent | null>(null);
  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setPending(event as InstallPromptEvent);
    };
    const clear = () => setPending(null);
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', clear);
    return () => {
      window.removeEventListener('beforeinstallprompt', capture);
      window.removeEventListener('appinstalled', clear);
    };
  }, []);
  const install = pending
    ? () => {
        setPending(null);
        void pending.prompt().catch(() => {});
      }
    : null;

  return (
    <InstallContext.Provider value={install}>
      {children}
    </InstallContext.Provider>
  );
}

export const usePwaInstall = () => useContext(InstallContext);
