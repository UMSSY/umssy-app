import '@/shared/testing/indexed-db.mock';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePwaInstall } from '@/shared/contexts/pwa-install-context';
import { saveAccessToken } from '@/shared/services/storage/access-token-storage';
import { Providers } from './providers';

vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }));
vi.mock('@/modules/auth/services/auth.service', () => ({
  authService: { getSession: vi.fn().mockResolvedValue({ id: 'qa', roles: ['titulado'] }) },
}));

function InstallButton() {
  const { install } = usePwaInstall();
  return install ? <span role="button" onClick={install}>Instalar</span> : <p>Sin instalación</p>;
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Providers and the PWA install prompt', () => {
  it('keeps the captured install prompt after the session changes', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    render(
      <Providers>
        <InstallButton />
      </Providers>,
    );
    expect(screen.getByText('Sin instalación')).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt }));
    });
    await act(async () => {
      await saveAccessToken(`h.${btoa(JSON.stringify({ sub: 'user-a' }))}.s`);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Instalar' }));
    expect(prompt).toHaveBeenCalledOnce();
  });
});

describe('Providers without display mode support', () => {
  it('renders when the browser has no matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    render(
      <Providers>
        <InstallButton />
      </Providers>,
    );
    expect(screen.getByText('Sin instalación')).toBeInTheDocument();
  });
});
