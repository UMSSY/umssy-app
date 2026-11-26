import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { googleAuthService } from '../services/google-auth.service';
import { handleGoogleOAuthCallback } from '../utils/google-oauth-redirect';
import { startSession } from '../utils/session';
import { GoogleOAuthCallbackView } from './google-oauth-callback-view';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('../utils/google-oauth-redirect', () => ({ handleGoogleOAuthCallback: vi.fn() }));
vi.mock('../services/google-auth.service', () => ({ googleAuthService: { loginWithGoogle: vi.fn(), linkGoogleAccount: vi.fn(), confirmLink: vi.fn() } }));
vi.mock('../utils/session', () => ({ startSession: vi.fn() }));
vi.mock('@/shared/components/layout/brand-logo', () => ({ BrandLogo: () => <span>UMSSY</span> }));

const callback = {
  kind: 'redirect' as const,
  request: { state: 's', nonce: 'n', createdAt: 1, intent: 'login' as const, accountEmail: null, nextPath: '/profile' },
  profile: { email: 'qa@gmail.com', idToken: 'google-credential', credential: 'google-credential' },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(handleGoogleOAuthCallback).mockReturnValue(callback);
  vi.mocked(googleAuthService.loginWithGoogle).mockResolvedValue({ success: true, session: { accessToken: 'session-token', roleTag: 'titulado', roles: ['titulado'] } });
  vi.mocked(googleAuthService.linkGoogleAccount).mockResolvedValue({ success: true });
  vi.mocked(startSession).mockResolvedValue();
});

afterEach(cleanup);

describe('GoogleOAuthCallbackView', () => {
  it('validates a full-page login through the backend and starts the session only once', async () => {
    render(<StrictMode><GoogleOAuthCallbackView /></StrictMode>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/profile'));
    expect(handleGoogleOAuthCallback).toHaveBeenCalledOnce();
    expect(googleAuthService.loginWithGoogle).toHaveBeenCalledExactlyOnceWith('qa@gmail.com', 'google-credential');
    expect(startSession).toHaveBeenCalledExactlyOnceWith('session-token');
    expect(googleAuthService.linkGoogleAccount).not.toHaveBeenCalled();
  });

  it('keeps a popup callback separate from a full-page login', async () => {
    vi.mocked(handleGoogleOAuthCallback).mockReturnValue({ kind: 'popup' });
    render(<GoogleOAuthCallbackView />);
    expect(await screen.findByText(/Puedes volver a la ventana/)).toBeInTheDocument();
    expect(googleAuthService.loginWithGoogle).not.toHaveBeenCalled();
    expect(startSession).not.toHaveBeenCalled();
  });

  it('completes linking for the activated account without turning it into a login', async () => {
    vi.mocked(handleGoogleOAuthCallback).mockReturnValue({ ...callback, request: { ...callback.request, intent: 'link', accountEmail: 'qa@gmail.com' } });
    render(<GoogleOAuthCallbackView />);
    expect(await screen.findByRole('heading', { name: 'Cuenta de Google vinculada' })).toBeInTheDocument();
    expect(googleAuthService.linkGoogleAccount).toHaveBeenCalledExactlyOnceWith('qa@gmail.com', 'qa@gmail.com', 'google-credential');
    expect(googleAuthService.loginWithGoogle).not.toHaveBeenCalled();
    expect(startSession).not.toHaveBeenCalled();
  });

  it('does not create a session when the backend rejects the Google account', async () => {
    vi.mocked(googleAuthService.loginWithGoogle).mockResolvedValue({ success: false, reason: 'not_registered', message: 'Esta cuenta no está registrada.' });
    render(<GoogleOAuthCallbackView />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Esta cuenta no está registrada.');
    expect(startSession).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows a linking rejection without starting another session', async () => {
    vi.mocked(handleGoogleOAuthCallback).mockReturnValue({ ...callback, request: { ...callback.request, intent: 'link', accountEmail: 'qa@gmail.com' } });
    vi.mocked(googleAuthService.linkGoogleAccount).mockResolvedValue({ success: false, reason: 'email_mismatch', message: 'El correo no coincide.' });
    render(<GoogleOAuthCallbackView />);
    expect(await screen.findByRole('alert')).toHaveTextContent('El correo no coincide.');
    expect(startSession).not.toHaveBeenCalled();
  });

  it('does not contact authentication endpoints for an invalid callback', async () => {
    vi.mocked(handleGoogleOAuthCallback).mockImplementation(() => { throw new Error('El acceso venció.'); });
    render(<GoogleOAuthCallbackView />);
    expect(await screen.findByRole('alert')).toHaveTextContent('El acceso venció.');
    expect(googleAuthService.loginWithGoogle).not.toHaveBeenCalled();
    expect(googleAuthService.linkGoogleAccount).not.toHaveBeenCalled();
  });

  describe('confirmación de la vinculación', () => {
    const link = { linkToken: 'link-token', email: 'qa@gmail.com', emailVerified: true };
    const session = { accessToken: 'linked-token', roleTag: 'titulado' as const, roles: ['titulado' as const] };

    beforeEach(() => {
      vi.mocked(googleAuthService.loginWithGoogle).mockResolvedValue({ success: true, requiresLinking: true, link });
    });

    it('muestra la pantalla de confirmación y no inicia sesión hasta que la persona confirma', async () => {
      render(<GoogleOAuthCallbackView />);

      expect(await screen.findByRole('heading', { name: 'Vincula tu cuenta de Google' })).toBeInTheDocument();
      expect(screen.getByText('qa@gmail.com')).toBeInTheDocument();
      expect(startSession).not.toHaveBeenCalled();
      expect(googleAuthService.confirmLink).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    });

    it('vincular y continuar abre la sesión y «Ir al inicio» navega al destino del flujo', async () => {
      vi.mocked(googleAuthService.confirmLink).mockResolvedValue({ success: true, session });
      render(<GoogleOAuthCallbackView />);

      fireEvent.click(await screen.findByRole('button', { name: 'Vincular y continuar' }));

      expect(await screen.findByRole('heading', { name: '¡Bienvenido de nuevo!' })).toBeInTheDocument();
      expect(googleAuthService.confirmLink).toHaveBeenCalledExactlyOnceWith('link-token');
      expect(startSession).toHaveBeenCalledExactlyOnceWith('linked-token');
      fireEvent.click(screen.getByRole('button', { name: 'Ir al inicio' }));
      expect(replace).toHaveBeenCalledWith('/profile');
    });

    it('cancelar y elegir otra cuenta regresan al inicio de sesión sin vincular', async () => {
      render(<GoogleOAuthCallbackView />);

      fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
      expect(replace).toHaveBeenCalledWith('/login');

      fireEvent.click(screen.getByRole('button', { name: 'Elegir otra cuenta' }));
      expect(replace).toHaveBeenCalledTimes(2);
      expect(googleAuthService.confirmLink).not.toHaveBeenCalled();
      expect(startSession).not.toHaveBeenCalled();
    });

    it('un token vencido muestra el error dentro de la confirmación', async () => {
      vi.mocked(googleAuthService.confirmLink).mockResolvedValue({ success: false, reason: 'expired', message: 'Vuelve a iniciar con Google' });
      render(<GoogleOAuthCallbackView />);

      fireEvent.click(await screen.findByRole('button', { name: 'Vincular y continuar' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Vuelve a iniciar con Google');
      expect(startSession).not.toHaveBeenCalled();
    });
  });
});
