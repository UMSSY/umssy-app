'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BrandLogo } from '@/shared/components/layout/brand-logo';
import { useRouter } from 'next/navigation';
import {
  CircleAlert,
  LoaderCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Mail,
  Clock,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleIcon } from '@/shared/components/icons/google-icon';
import { googleAuthService } from '../services/google-auth.service';
import { useLogin } from '../hooks/use-login';
import { useCredentialRestrictions } from '../hooks/use-credential-restrictions';
import { CredentialRestrictionNotice } from '../components/credential-restriction-notice';
import {
  getCredentialLimit,
  toAuthRequestError,
} from '../utils/auth-request-error';
import { useRedirectAuthenticated } from '../hooks/use-redirect-authenticated';
import { NEXT_PARAM } from '../constants/session.constants';
import { resolvePostLoginPath } from '../utils/resolve-post-login-path';
import { startSession } from '../utils/session';
import {
  validateLoginFields,
  type LoginFieldErrors,
} from '../utils/validate-login-fields';

export function LoginView() {
  const router = useRouter();
  const restrictions = useCredentialRestrictions();
  const { login, isLoading, error } = useLogin((cause, payload) =>
    restrictions.restrict(
      payload.email,
      getCredentialLimit(cause),
      toAuthRequestError(cause, 'No se pudo iniciar sesión.').message,
    ),
  );
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [accessDeniedState, setAccessDeniedState] = useState<{
    reason: 'not_registered' | 'role_not_allowed';
    message?: string;
  } | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const isAccessDenied = accessDeniedState !== null;

  const [isExpiredNoticeVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const reason = new URLSearchParams(window.location.search).get('reason');
    return reason === 'SESSION_EXPIRED' || reason === 'session_expired';
  });



  useRedirectAuthenticated(!isSigningIn);
  const loginRestriction = restrictions.getRestriction('login', email);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setGoogleError(null);
    if (isLoading || isSigningIn || restrictions.isBlocked('login', email))
      return;
    const errors = validateLoginFields(email, password);
    setFieldErrors(errors);
    if (errors.email || errors.password) return;
    const result = await login({ email, password });
    if (result) {
      setIsSigningIn(true);
      await startSession(result.accessToken);
      const urlNext = new URLSearchParams(window.location.search).get(
        NEXT_PARAM,
      );
      const storedNext =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('umssy_post_login_redirect')
          : null;
      if (typeof window !== 'undefined' && storedNext) {
        sessionStorage.removeItem('umssy_post_login_redirect');
      }
      const next = urlNext || storedNext;
      router.push(resolvePostLoginPath(result.roles ?? result.roleTag, next));
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setAccessDeniedState(null);
    setGoogleError(null);

    try {
      const googleProfile = await googleAuthService.promptSelectAccount({
        intent: 'login',
      });
      if (!googleProfile?.email) return;

      const credential = googleProfile.idToken || googleProfile.credential;
      const result = credential
        ? await googleAuthService.loginWithGoogle(googleProfile.email, credential)
        : await googleAuthService.loginWithGoogle(googleProfile.email);

      if (result.success && result.session) {
        setIsSigningIn(true);
        await startSession(result.session.accessToken);
        const next = new URLSearchParams(window.location.search).get(
          NEXT_PARAM,
        );
        router.push(
          resolvePostLoginPath(
            result.session.roles ?? result.session.roleTag,
            next,
          ),
        );
      } else if (result.reason === 'role_not_allowed') {
        setAccessDeniedState({
          reason: 'role_not_allowed',
          message:
            result.message ||
            'El acceso con Google solo está permitido para estudiantes, titulados y mentores.',
        });
      } else if (result.reason === 'not_registered') {
        setAccessDeniedState({
          reason: 'not_registered',
          message:
            result.message ||
            'Esta cuenta de Google no está registrada en el sistema. Por favor, inicia sesión con un correo electrónico previamente registrado.',
        });
      } else {
        setGoogleError(
          result.message ||
            'Ocurrió un error al intentar iniciar sesión con Google.',
        );
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message.includes('NEXT_PUBLIC_GOOGLE_CLIENT_ID')
      ) {
        setGoogleError(
          'El servicio de inicio de sesión con Google no está disponible en este momento. Por favor, inicia sesión con tu correo y contraseña.',
        );
      }
      // User closed Google popup or cancelled
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <main className="grid min-h-dvh bg-surface lg:grid-cols-(--grid-template-columns-login)">
      <aside className="relative hidden lg:block">
        <Image
          src="/images/campus-fcyt.webp"
          alt=""
          fill
          priority
          sizes="60vw"
          className="object-cover"
        />
      </aside>
      <div className="flex min-h-dvh flex-col px-4 py-5 sm:px-8 sm:py-9 lg:px-10 xl:px-12">
        <Link
          href="/"
          className="flex items-center gap-2 self-start text-sm font-medium text-accent"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al inicio
        </Link>
        <div className="flex flex-1 items-center justify-center py-6 sm:py-12">
          {isAccessDenied ? (
            <div className="w-full max-w-login-form animate-in duration-300 ease-out fade-in slide-in-from-right-2">
              <Link
                href="/"
                aria-label="UMSSY, volver al inicio"
                className="mb-8 inline-block"
              >
                <BrandLogo priority className="w-56" />
              </Link>
              <h1 className="font-tight text-3xl font-extrabold text-ink md:text-4xl">
                Acceso no permitido
              </h1>
              <p className="mt-3 mb-8 text-base leading-relaxed text-text-secondary">
                {accessDeniedState?.reason === 'role_not_allowed'
                  ? accessDeniedState.message ||
                    'El acceso con Google solo está permitido para estudiantes, titulados y mentores. Si eres empresa o administrativo, por favor inicia sesión con tu correo electrónico y contraseña.'
                  : 'Esta cuenta de Google no está registrada en el sistema. Por favor, inicia sesión con un correo electrónico previamente registrado.'}
              </p>
              {accessDeniedState?.reason === 'role_not_allowed' ? (
                <>
                  <Button
                    type="button"
                    variant="institutional"
                    onClick={() => setAccessDeniedState(null)}
                    className="flex h-12 w-full items-center justify-center gap-2 text-base font-extrabold tracking-wide uppercase"
                  >
                    INICIAR SESIÓN CON CONTRASEÑA →
                  </Button>
                  <div className="mt-6 text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleGoogleLogin}
                      className="text-sm font-semibold text-accent hover:underline"
                    >
                      Probar con otra cuenta de Google
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="institutional"
                    onClick={handleGoogleLogin}
                    className="flex h-12 w-full items-center justify-center gap-2 text-base font-extrabold tracking-wide uppercase"
                  >
                    PROBAR CON OTRA CUENTA →
                  </Button>
                  <div className="mt-6 text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setAccessDeniedState(null)}
                      className="text-sm font-semibold text-accent hover:underline"
                    >
                      Volver a iniciar sesión
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="w-full max-w-login-form animate-in duration-300 ease-out fade-in slide-in-from-right-2"
            >
              <Link
                href="/"
                aria-label="UMSSY, volver al inicio"
                className="mb-8 inline-block"
              >
                <BrandLogo priority className="w-56" />
              </Link>
              <h1 className="font-tight text-4xl font-extrabold text-ink">
                Iniciar sesión
              </h1>
              <p className="mt-3 mb-8 text-base text-text-secondary">
                Ingresa con tu cuenta de UMSSY.
              </p>

              {isExpiredNoticeVisible ? (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200"
                >
                  <Clock
                    className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      Tu sesión expiró
                    </h2>
                    <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                      Por seguridad la cerramos tras 15 minutos sin actividad.
                      Inicia sesión de nuevo y volverás a la página donde
                      estabas.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mb-4">
                <Label
                  htmlFor="login-email"
                  className="mb-1.5 text-[12.5px] font-semibold text-ink"
                >
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute top-4 left-4 size-5 text-accent"
                    aria-hidden="true"
                  />
                  <Input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="username"
                    disabled={isLoading}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={fieldErrors.email ? true : undefined}
                    aria-describedby={
                      fieldErrors.email
                        ? 'login-email-hint login-email-error'
                        : 'login-email-hint'
                    }
                    className="h-13 rounded-lg border-border-strong bg-surface px-12 text-base text-ink focus-visible:border-accent focus-visible:ring-accent/15 md:text-base"
                    placeholder="nombre@ejemplo.com"
                  />
                </div>
                <p
                  id="login-email-hint"
                  className="mt-2 text-xs text-text-secondary"
                >
                  Usa el correo con el que solicitaste acceso.
                </p>
                {fieldErrors.email ? (
                  <p
                    id="login-email-error"
                    role="alert"
                    className="mt-1.5 text-[13px] font-medium text-danger"
                  >
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div className="mb-6">
                <div className="mb-1.5 flex items-center justify-between">
                  <Label
                    htmlFor="login-password"
                    className="text-[12.5px] font-semibold text-ink"
                  >
                    Contraseña
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-accent hover:underline focus-visible:rounded-xs focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-hidden"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute top-4 left-4 size-5 text-accent"
                    aria-hidden="true"
                  />
                  <Input
                    id="login-password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={fieldErrors.password ? true : undefined}
                    aria-describedby={
                      fieldErrors.password ? 'login-password-error' : undefined
                    }
                    className="h-13 rounded-lg border-border-strong bg-surface px-12 text-base text-ink focus-visible:border-accent focus-visible:ring-accent/15 md:text-base"
                    placeholder="Tu contraseña"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={
                      isPasswordVisible
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                    aria-pressed={isPasswordVisible}
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute top-1.5 right-1.5"
                  >
                    {isPasswordVisible ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </Button>
                </div>
                {fieldErrors.password ? (
                  <p
                    id="login-password-error"
                    role="alert"
                    className="mt-1.5 text-[13px] font-medium text-danger"
                  >
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

              <CredentialRestrictionNotice restriction={loginRestriction} />

              {error ? (
                <Alert className="mb-4 border-danger/25 bg-surface text-danger">
                  <CircleAlert aria-hidden="true" />
                  <AlertDescription className="font-medium text-danger">
                    {error}
                  </AlertDescription>
                </Alert>
              ) : null}

              {googleError ? (
                <Alert className="mb-4 border-danger/25 bg-surface text-danger">
                  <CircleAlert aria-hidden="true" />
                  <AlertDescription className="font-medium text-danger">
                    {googleError}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                variant="institutional"
                disabled={isLoading || isGoogleLoading || isSigningIn || Boolean(loginRestriction)}
                className="h-12 w-full text-base font-extrabold tracking-wide uppercase"
              >
                {isLoading ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : null}
                {isLoading ? 'Ingresando...' : 'Iniciar sesión'}
                {!isLoading ? <ArrowRight aria-hidden="true" /> : null}
              </Button>

              <div className="relative my-6 text-center text-xs text-text-secondary">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <span className="relative bg-surface px-3">o continúa con</span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading || isSigningIn || Boolean(loginRestriction)}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border-border-strong bg-surface text-base font-semibold text-ink hover:bg-neutral-50"
              >
                {isGoogleLoading ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <GoogleIcon className="size-5" />
                )}
                {isGoogleLoading
                  ? 'Conectando con Google...'
                  : 'Continuar con Google'}
              </Button>

              <p className="mt-8 border-t border-border pt-6 text-center text-sm text-text-secondary">
                ¿Aún no tienes cuenta?{' '}
                <Link
                  href="/request-access"
                  className="font-semibold text-ink underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  Solicitar acceso
                </Link>
              </p>
              <div className="mt-6 border-t border-border pt-6 text-center">
                <Link
                  href="/workshops"
                  className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
                >
                  Explorar talleres sin iniciar sesión
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-text-secondary">
          UMSSY · Universidad Mayor de San Simón
        </p>
      </div>
    </main>
  );
}
