"use client";

import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/shared/components/icons/google-icon";

interface GoogleLoginButtonProps {
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function GoogleLoginButton({ isLoading, disabled, onClick }: GoogleLoginButtonProps) {
  return (
    <>
      <div className="relative my-6 text-center text-xs text-text-secondary">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative bg-surface px-3">o continúa con</span>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={disabled}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border-border-strong bg-surface text-base font-semibold text-ink hover:bg-neutral-50"
      >
        {isLoading ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <GoogleIcon className="size-5" />
        )}
        {isLoading ? "Conectando con Google..." : "Continuar con Google"}
      </Button>
    </>
  );
}
