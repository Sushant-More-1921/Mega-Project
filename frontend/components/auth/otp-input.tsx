"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  onComplete?: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Array of single digit chars
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const setDigitAt = (index: number, newDigit: string) => {
    const chars = value.split("");
    while (chars.length < length) chars.push("");
    chars[index] = newDigit;
    const combined = chars.join("").slice(0, length);
    onChange(combined);

    if (combined.length === length && onComplete) {
      onComplete(combined);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      setDigitAt(index, "");
      return;
    }

    // If typing a single digit or pasting into a slot
    const lastChar = rawVal.slice(-1);
    setDigitAt(index, lastChar);

    // Focus next box if available
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        inputRefs.current[index - 1]?.focus();
        setDigitAt(index - 1, "");
      } else {
        setDigitAt(index, "");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pastedData) return;

    const truncated = pastedData.slice(0, length);
    onChange(truncated);

    const focusIdx = Math.min(truncated.length, length - 1);
    inputRefs.current[focusIdx]?.focus();

    if (truncated.length === length && onComplete) {
      onComplete(truncated);
    }
  };

  return (
    <div
      className="flex items-center justify-between gap-1.5 sm:gap-2.5 w-full my-2"
      role="group"
      aria-label="6-digit verification code"
    >
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={digits[index]}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={cn(
              "w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-lg border transition-all duration-150 select-none",
              "focus:outline-none focus:ring-2 focus:ring-offset-1",
              disabled
                ? "bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0] cursor-not-allowed"
                : hasError
                ? "border-[#DC2626] bg-[#FEF2F2] text-[#DC2626] focus:ring-[#FECACA] focus:border-[#DC2626] animate-[shake_0.25s_ease-in-out]"
                : isFilled
                ? "border-[#0B4EA2] bg-[#EAF2FF]/30 text-[#0F172A] focus:ring-[#EAF2FF] focus:border-[#0B4EA2]"
                : "border-[#CBD5E1] bg-white text-[#0F172A] hover:border-[#94A3B8] focus:border-[#0B4EA2] focus:ring-[#EAF2FF]"
            )}
          />
        );
      })}
    </div>
  );
}
