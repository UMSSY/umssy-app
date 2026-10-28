"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { OTP_LENGTH } from "../../constants/account-activation.constants";
import { sanitizeOtp } from "../../utils/sanitize-otp";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

// Seis casillas visibles; admite escribir, borrar, mover con flechas y pegar el código completo
export function OtpInput({ value, onChange, disabled, invalid, describedBy }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function focusAt(index: number) {
    refs.current[Math.min(Math.max(index, 0), OTP_LENGTH - 1)]?.focus();
  }

  function handleChange(index: number, raw: string) {
    const digits = sanitizeOtp(raw);
    if (digits === "") {
      onChange(value.slice(0, index) + value.slice(index + 1));
      return;
    }
    const next = sanitizeOtp(value.slice(0, index) + digits + value.slice(index + 1));
    onChange(next);
    focusAt(index + digits.length);
  }

  return (
    <div role="group" aria-label="Código de verificación de 6 dígitos" className="flex justify-between gap-2 sm:gap-3">
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <Input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={OTP_LENGTH}
          disabled={disabled}
          value={value[index] ?? ""}
          aria-label={`Dígito ${index + 1} de ${OTP_LENGTH}`}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => handleChange(index, event.target.value)}
          onFocus={(event) => event.target.select()}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !value[index]) focusAt(index - 1);
            if (event.key === "ArrowLeft") focusAt(index - 1);
            if (event.key === "ArrowRight") focusAt(index + 1);
          }}
          className="h-13 w-full min-w-0 rounded-lg border-border-strong bg-surface px-0 text-center text-xl font-semibold text-ink focus-visible:border-accent focus-visible:ring-accent/15 md:text-xl"
        />
      ))}
    </div>
  );
}
