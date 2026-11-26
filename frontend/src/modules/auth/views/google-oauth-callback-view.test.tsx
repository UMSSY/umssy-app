import { StrictMode } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { googleAuthService } from '../services/google-auth.service';
import { handleGoogleOAuthCallback } from '../utils/google-oauth-redirect';
import { startSession } from '../utils/session';
import { GoogleOAuthCallbackView } from './google-oauth-callback-view';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('../utils/google-oauth-redirect', () => ({ handleGoogleOAuthCallback: vi.fn() }));
vi.mock('../services/google-auth.service', () => ({ googleAuthService: { loginWithGoogle: vi.fn(), linkGoogleAccount: vi.fn() } }));
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
});
