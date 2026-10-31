"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RequestStatusFormProps } from "../../types/request-status-form-props.types";

export function RequestStatusForm({
  isLoading,
  onLookup,
}: RequestStatusFormProps) {
  const formId = useId();
  const emailId = formId + "-email";
  const hintId = formId + "-hint";
  const [email, setEmail] = useState("");

  return (
    <form
      aria-label="Verificar correo de la solicitud"
      aria-busy={isLoading}
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5"
      onSubmit={(event) => {
        event.preventDefault();

        if (isLoading || !event.currentTarget.checkValidity()) return;

        void onLookup(email);
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={emailId} className="text-sm font-semibold text-ink">
          Correo electrónico
        </Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nombre@ejemplo.com"
          aria-describedby={hintId}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          disabled={isLoading}
          className="text-ink"
        />
        <p id={hintId} className="text-sm text-text-secondary">
          Ingresa el correo que registraste al solicitar acceso.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !email.trim()}
        className="w-full sm:w-fit"
      >
        {isLoading ? "Consultando..." : "Continuar"}
      </Button>
    </form>
  );
}
