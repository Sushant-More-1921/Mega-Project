import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "ai" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Base styles: consistent 8px radius (rounded-lg), transitions, focus rings
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]";

    const variantStyles: Record<string, string> = {
      primary:
        "bg-[#0B4EA2] text-white hover:bg-[#083B7A] focus-visible:ring-[#0B4EA2] shadow-sm",
      secondary:
        "bg-white text-[#0B4EA2] border border-[#CBD5E1] hover:bg-[#F8FAFC] hover:border-[#0B4EA2] focus-visible:ring-[#0B4EA2] shadow-sm",
      success:
        "bg-[#16A34A] text-white hover:bg-[#15803D] focus-visible:ring-[#16A34A] shadow-sm",
      danger:
        "bg-[#DC2626] text-white hover:bg-[#B91C1C] focus-visible:ring-[#DC2626] shadow-sm",
      ai:
        "bg-[#5B21B6] text-white hover:bg-[#4C1D95] focus-visible:ring-[#5B21B6] shadow-sm",
      ghost:
        "bg-transparent text-[#0F172A] hover:bg-[#F1F5F9] focus-visible:ring-[#0B4EA2]",
      outline:
        "bg-transparent text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] focus-visible:ring-[#0B4EA2]",
    };

    const sizeStyles: Record<string, string> = {
      sm: "h-9 px-3 text-xs gap-1.5",
      md: "h-11 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5 font-semibold",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
