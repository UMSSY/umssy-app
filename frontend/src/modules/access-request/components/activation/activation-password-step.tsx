"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPasswordRules, validatePasswords, type PasswordErrors } from "@/shared/utils/password-rules";
import { PasswordField } from "@/shared/components/password-field";
import { PasswordRequirements } from "@/shared/components/password-requirements";

interface ActivationPasswordStepProps {
  isActivating: boolean;
  serverError?: string | undefined;
  onSubmit: (password: string) => void;
  onBack: () => void;
}

export function ActivationPasswordStep({ isActivating, serverError, onSubmit, onBack }: ActivationPasswordStepProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<PasswordErrors>({});
  const allMet = getPasswordRules(password).every((rule) => rule.met);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validatePasswords(password, confirm);
    setErrors(found);
    if (!found.password && !found.confirm) onSubmit(password);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-md">
      <ShieldCheck aria-hidden="true" className="mb-4 size-9 text-accent" />
      <h1 className="font-tight text-3xl font-extrabold text-ink">Crea tu contraseña</h1>
      <p className="mt-3 mb-6 text-base text-text-secondary">Código verificado. Elige la contraseña con la que vas a ingresar.</p>

      <PasswordField
        id="activation-password"
        label="Contraseña"
        value={password}
        onChange={setPassword}
        error={errors.password ?? serverError}
        describedBy="activation-password-rules"
        disabled={isActivating}
      />
      <PasswordRequirements id="activation-password-rules" password={password} />

      <div className="mt-5">
        <PasswordField
          id="activation-confirm"
          label="Confirmar contraseña"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
          disabled={isActivating}
        />
      </div>

      <Button type="submit" variant="institutional" disabled={isActivating || !allMet || confirm === ""} className="mt-6 h-12 w-full text-base font-extrabold">
        {isActivating ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
        {isActivating ? "Activando..." : "Activar cuenta"}
      </Button>
      <Button type="button" variant="ghost" onClick={onBack} disabled={isActivating} className="mt-3 w-full">
        <ArrowLeft aria-hidden="true" />
        Cambiar el código
      </Button>
    </form>
  );
}
