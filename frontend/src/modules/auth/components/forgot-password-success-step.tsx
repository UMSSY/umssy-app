import { BrandLogo } from "@/shared/components/layout/brand-logo";
import { Button } from "@/components/ui/button";

interface ForgotPasswordSuccessStepProps {
  onGoToLogin: () => void;
}

export function ForgotPasswordSuccessStep({ onGoToLogin }: ForgotPasswordSuccessStepProps) {
  return (
    <div className="text-center">
      <div className="mb-8 flex justify-center">
        <BrandLogo priority className="w-56" />
      </div>

      <h1 className="font-tight text-3xl font-extrabold text-ink md:text-4xl">¡Contraseña actualizada!</h1>
      <p className="mt-2 mb-8 text-base text-text-secondary">
        Ya puedes iniciar sesión con tu nueva contraseña.
      </p>

      <Button
        type="button"
        variant="institutional"
        onClick={onGoToLogin}
        className="h-12 w-full text-base font-extrabold tracking-wide uppercase institutional-button"
      >
        IR A INICIAR SESIÓN →
      </Button>
    </div>
  );
}

