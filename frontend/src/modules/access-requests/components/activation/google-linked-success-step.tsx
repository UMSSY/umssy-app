'use client';

import { Button } from '@/components/ui/button';

interface GoogleLinkedSuccessStepProps {
  googleEmail: string;
  onGoToLogin: () => void;
}

export function GoogleLinkedSuccessStep({
  googleEmail,
  onGoToLogin,
}: GoogleLinkedSuccessStepProps) {
  return (
    <div className="w-full max-w-md animate-in duration-300 ease-out fade-in slide-in-from-right-2">
      <h1 className="font-tight text-3xl font-extrabold text-ink md:text-4xl">
        Google vinculada
      </h1>
      <p className="mt-3 mb-8 text-base leading-relaxed text-text-secondary">
        Tu cuenta de Google ({googleEmail}) quedó vinculada. Desde ahora puedes
        entrar con ella.
      </p>

      <Button
        type="button"
        variant="institutional"
        onClick={onGoToLogin}
        className="flex h-12 w-full items-center justify-center gap-2 text-base font-extrabold tracking-wide uppercase"
      >
        IR A INICIAR SESIÓN →
      </Button>
    </div>
  );
}
