'use client';

import { Button } from '@/components/ui/button';

interface GoogleAccessDeniedStepProps {
  onRetryAnotherAccount: () => void;
  onGoToLogin?: () => void;
  title?: string;
  message?: string;
}

export function GoogleAccessDeniedStep({
  onRetryAnotherAccount,
  onGoToLogin,
  title = 'Acceso no permitido',
  message = 'Esta cuenta de Google no está registrada en el sistema. Por favor, inicia sesión con un correo electrónico previamente registrado.',
}: GoogleAccessDeniedStepProps) {
  return (
    <div className="w-full max-w-md animate-in duration-300 ease-out fade-in slide-in-from-right-2">
      <h1 className="font-tight text-3xl font-extrabold text-ink md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 mb-8 text-base leading-relaxed text-text-secondary">
        {message}
      </p>

      <div className="space-y-4">
        <Button
          type="button"
          variant="institutional"
          onClick={onRetryAnotherAccount}
          className="flex h-12 w-full items-center justify-center gap-2 text-base font-extrabold tracking-wide uppercase"
        >
          PROBAR CON OTRA CUENTA →
        </Button>

        {onGoToLogin ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onGoToLogin}
            className="h-10 w-full text-sm font-medium text-text-secondary hover:text-ink"
          >
            Volver a inicio de sesión
          </Button>
        ) : null}
      </div>
    </div>
  );
}
