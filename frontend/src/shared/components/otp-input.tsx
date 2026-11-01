"use client";

import { useRef, type KeyboardEvent, type ClipboardEvent, type ChangeEvent, type FocusEvent } from "react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";

import type { OtpInputProps } from "../types/otp-input-props.types";


export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  invalid = false,
  id = "otp-input",
  describedBy,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, index) => value[index] || "");

  function handleFocus(index: number, event: FocusEvent<HTMLInputElement>) {
    const firstEmptyIndex = value.length;
    if (index > firstEmptyIndex && firstEmptyIndex < length) {
      inputRefs.current[firstEmptyIndex]?.focus();
      return;
    }
    event.target.select();
  }

  function handleDigitChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const rawVal = event.target.value;
    const cleaned = rawVal.replace(/\D/g, "");

    if (!cleaned) {
      const newDigits = [...digits];
      newDigits[index] = "";
      onChange(newDigits.join(""));
      return;
    }

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, length);
      onChange(pasted);
      const nextFocus = Math.min(pasted.length, length - 1);
      setTimeout(() => {
        inputRefs.current[nextFocus]?.focus();
        inputRefs.current[nextFocus]?.select();
      }, 0);
      return;
    }

    const digit = cleaned.slice(-1);
    const targetIndex = index > value.length ? value.length : index;
    const newDigits = [...digits];
    newDigits[targetIndex] = digit;
    const newValue = newDigits.join("");
    onChange(newValue);

    if (targetIndex < length - 1) {
      setTimeout(() => {
        inputRefs.current[targetIndex + 1]?.focus();
        inputRefs.current[targetIndex + 1]?.select();
      }, 0);
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      } else if (index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
          inputRefs.current[index - 1]?.select();
        }, 0);
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
    setTimeout(() => {
      inputRefs.current[focusTarget]?.focus();
      inputRefs.current[focusTarget]?.select();
    }, 0);
  }

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3" role="group" aria-label="Código de verificación">
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          id={index === 0 ? id : `${id}-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          value={digits[index]}
          disabled={disabled}
          onChange={(event) => handleDigitChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => handleFocus(index, event)}
          onClick={() => {
            const firstEmptyIndex = value.length;
            if (index > firstEmptyIndex && firstEmptyIndex < length) {
              inputRefs.current[firstEmptyIndex]?.focus();
            }
          }}
          aria-label={`Dígito ${index + 1} de ${length}`}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          data-testid={`otp-input-${index}`}
          className={cn(
            "size-12 rounded-xl border-2 border-border-strong bg-surface px-0 text-center text-xl font-bold text-ink transition-all duration-150 sm:size-14 sm:text-2xl md:text-2xl",
            "outline-hidden focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20",
            disabled && "cursor-not-allowed opacity-50",
            invalid && "border-danger text-danger ring-2 ring-danger/20"
          )}
        />
      ))}
    </div>
  );
}

