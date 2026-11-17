'use client';

import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/shared/components/icons/google-icon';

interface ActivationSuccessStepProps {
  onLinkGoogle: () => void;
  onGoToLogin: () => void;
  isLinking?: boolean;
}

export function ActivationSuccessStep({
  onLinkGoogle,
  onGoToLogin,
  isLinking = false,
}: ActivationSuccessStepProps) {
  return (
    <div className="w-full max-w-md animate-in duration-300 ease-out fade-in slide-in-from-right-2">
      <h1 className="font-tight text-3xl font-extrabold text-ink md:text-4xl">
        ¡Cuenta activada!
      </h1>
      <p className="mt-3 mb-8 text-base leading-relaxed text-text-secondary">
        Ya puedes iniciar sesión con tu correo y contraseña. Si quieres, vincula
        tu cuenta de Google para entrar más rápido la próxima vez.
      </p>

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={onLinkGoogle}
          disabled={isLinking}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border-border-strong bg-surface text-base font-semibold text-ink hover:bg-neutral-50"
        >
          <GoogleIcon className="size-5" />
          Vincular con Google
        </Button>

        <Button
          type="button"
          variant="institutional"
          onClick={onGoToLogin}
          className="flex h-12 w-full items-center justify-center gap-2 text-base font-extrabold tracking-wide uppercase institutional-button"
        >
          IR A INICIAR SESIÓN →
        </Button>
      </div>
    </div>
  );
}
