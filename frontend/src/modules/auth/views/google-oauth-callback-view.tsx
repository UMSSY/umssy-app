'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button-variants';
import { BrandLogo } from '@/shared/components/layout/brand-logo';
import { googleAuthService } from '../services/google-auth.service';
import { handleGoogleOAuthCallback } from '../utils/google-oauth-redirect';
import { resolvePostLoginPath } from '../utils/resolve-post-login-path';
import { startSession } from '../utils/session';

export function GoogleOAuthCallbackView() {
  const router = useRouter();
  const started = useRef(false);
  const [status, setStatus] = useState<'pending' | 'popup' | 'linked' | 'error'>('pending');
  const [message, setMessage] = useState('Estamos completando tu acceso con Google.');

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function complete() {
      try {
        const callback = handleGoogleOAuthCallback();
        if (callback.kind === 'popup') {
          setStatus('popup');
          setMessage('Puedes volver a la ventana donde iniciaste el proceso.');
          return;
        }
        const { request, profile } = callback;
        if (request.intent === 'link') {
          const result = await googleAuthService.linkGoogleAccount(
            request.accountEmail ?? '', profile.email, profile.idToken,
          );
          if (!result.success) throw new Error(result.message || 'No se pudo vincular la cuenta de Google.');
          setStatus('linked');
          setMessage('Tu cuenta de Google quedó vinculada correctamente.');
          return;
        }
        const result = await googleAuthService.loginWithGoogle(profile.email, profile.idToken);
        if (!result.success || !result.session) throw new Error(result.message || 'No se pudo iniciar sesión con Google.');
        await startSession(result.session.accessToken);
        router.replace(resolvePostLoginPath(result.session.roles ?? result.session.roleTag, request.nextPath));
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'No se pudo completar el acceso con Google.');
      }
    }
    void complete();
  }, [router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface px-6 py-12 text-center">
      <BrandLogo />
      <h1 className="font-tight text-2xl font-extrabold text-ink">
        {status === 'error' ? 'No se pudo completar el acceso' : status === 'linked' ? 'Cuenta de Google vinculada' : 'Acceso con Google'}
      </h1>
      <p role={status === 'error' ? 'alert' : 'status'} className="max-w-md text-text-secondary">{message}</p>
      {status !== 'pending' ? <Link href="/login" className={buttonVariants()}>Ir a iniciar sesión</Link> : null}
    </main>
  );
}
