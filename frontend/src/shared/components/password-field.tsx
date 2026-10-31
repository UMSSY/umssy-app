"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_MAX_LENGTH } from "../constants/password.constants";
import { FieldError } from "./field-error";

export interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  describedBy?: string;
  disabled?: boolean;
  autoComplete?: string;
  toggleAriaLabel?: string;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  describedBy,
  disabled,
  autoComplete = "new-password",
  toggleAriaLabel,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const described = [describedBy, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;
  const toggleText = toggleAriaLabel ?? label.toLowerCase();

  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 text-[12.5px] font-semibold text-ink">
        {label}
      </Label>
      <div className="relative">
        <LockKeyhole aria-hidden="true" className="pointer-events-none absolute top-4 left-4 size-5 text-accent" />
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          maxLength={PASSWORD_MAX_LENGTH + 1}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={described}
          className="h-13 rounded-lg border-border-strong bg-surface px-12 text-base text-ink focus-visible:border-accent focus-visible:ring-accent/15 md:text-base"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={visible ? `Ocultar ${toggleText}` : `Mostrar ${toggleText}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          className="absolute top-1.5 right-1.5"
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
