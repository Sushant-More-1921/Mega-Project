"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RotateCcw, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResendTimerProps {
  initialSeconds?: number;
  onResend: () => Promise<void> | void;
  isResending?: boolean;
  disabled?: boolean;
}

export function ResendTimer({
  initialSeconds = 45,
  onResend,
  isResending = false,
  disabled = false,
}: ResendTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const handleTriggerResend = useCallback(async () => {
    if (secondsLeft > 0 || isResending || disabled) return;
    try {
      await onResend();
      setSecondsLeft(initialSeconds);
    } catch {
      // Handled in parent
    }
  }, [secondsLeft, isResending, disabled, onResend, initialSeconds]);

  // Format seconds into MM:SS
  const minutes = Math.floor(secondsLeft / 60);
  const remainingSeconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;

  return (
    <div className="flex items-center justify-between text-xs sm:text-sm py-2">
      <span className="text-[#64748B]">Didn&apos;t receive code?</span>

      {secondsLeft > 0 ? (
        <div className="flex items-center gap-1.5 text-[#64748B] font-medium bg-[#F1F5F9] px-2.5 py-1 rounded-md">
          <Clock className="w-3.5 h-3.5 text-[#0B4EA2]" />
          <span>
            Resend in <strong className="text-[#0B4EA2] font-semibold">{formattedTime}</strong>
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleTriggerResend}
          disabled={disabled || isResending}
          className={cn(
            "inline-flex items-center gap-1.5 font-semibold text-[#0B4EA2] hover:text-[#083B7A] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] rounded px-1 transition-colors",
            (disabled || isResending) && "opacity-50 cursor-not-allowed no-underline"
          )}
        >
          {isResending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resend OTP</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
