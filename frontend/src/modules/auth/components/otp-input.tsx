"use client";

import { useRef, type KeyboardEvent, type ClipboardEvent, type ChangeEvent } from "react";
import { cn } from "cn";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  isInvalid?: boolean;
  id?: string;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  isInvalid = false,
  id = "otp-input",
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, index) => value[index] || "");

  function handleDigitChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const rawVal = event.target.value;
    const digit = rawVal.replace(/\D/g, "").slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join("");
    onChange(newValue);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (!digits[index] && index > 0) {
        event.preventDefault();
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);
    const focusTarget = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusTarget]?.focus();
  }

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3" role="group" aria-label="Código de verificación">
      {Array.from({ length }).map((_, index) => (
        // eslint-disable-next-line no-restricted-syntax
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          id={index === 0 ? id : `${id}-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          value={digits[index]}
          disabled={disabled}
          onChange={(e) => handleDigitChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`Dígito ${index + 1} de ${length}`}
          aria-invalid={isInvalid ? true : undefined}
          data-testid={`otp-input-${index}`}
          className={cn(
            "size-12 rounded-xl border-2 border-border-strong bg-surface text-center text-xl font-bold text-ink transition-all duration-150 sm:size-14 sm:text-2xl",
            "outline-hidden focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20",
            disabled && "cursor-not-allowed opacity-50",
            isInvalid && "border-danger text-danger ring-2 ring-danger/20"
          )}
        />
      ))}
    </div>
  );
}
