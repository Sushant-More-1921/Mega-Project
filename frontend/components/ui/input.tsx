import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  isRequired?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      helperText,
      error,
      leftAddon,
      rightAddon,
      isRequired,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#0F172A]"
          >
            {label}
            {isRequired && <span className="text-[#DC2626] ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
              {leftAddon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full h-11 px-3.5 rounded-lg border bg-white text-[#0F172A] placeholder:text-[#94A3B8] text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-[#F1F5F9] disabled:text-[#64748B] disabled:cursor-not-allowed",
              leftAddon ? "pl-11" : "",
              rightAddon ? "pr-11" : "",
              error
                ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#FECACA]"
                : "border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#0B4EA2] focus:ring-[#EAF2FF]",
              className
            )}
            {...props}
          />

          {rightAddon && (
            <div className="absolute right-0 pr-3 flex items-center text-[#64748B]">
              {rightAddon}
            </div>
          )}
        </div>

        {error ? (
          <p className="flex items-center gap-1.5 text-xs text-[#DC2626] font-medium pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[#64748B] pt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
