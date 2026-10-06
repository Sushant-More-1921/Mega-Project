import * as React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "danger" | "warning" | "success" | "info";
  title?: string;
  children: React.ReactNode;
}

export function Alert({
  variant = "danger",
  title,
  children,
  className,
  ...props
}: AlertProps) {
  const configs = {
    danger: {
      bg: "bg-[#FEF2F2]",
      border: "border-[#FECACA]",
      text: "text-[#DC2626]",
      icon: <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />,
    },
    warning: {
      bg: "bg-[#FFF7E6]",
      border: "border-[#FDE68A]",
      text: "text-[#B45309]",
      icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />,
    },
    success: {
      bg: "bg-[#ECFDF3]",
      border: "border-[#BBF7D0]",
      text: "text-[#15803D]",
      icon: <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />,
    },
    info: {
      bg: "bg-[#EAF2FF]",
      border: "border-[#BFDBFE]",
      text: "text-[#0B4EA2]",
      icon: <Info className="w-5 h-5 text-[#0B4EA2] shrink-0 mt-0.5" />,
    },
  };

  const style = configs[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-lg border text-sm leading-relaxed",
        style.bg,
        style.border,
        style.text,
        className
      )}
      {...props}
    >
      {style.icon}
      <div className="flex-1">
        {title && <h5 className="font-semibold text-sm mb-0.5">{title}</h5>}
        <div className="text-xs sm:text-sm font-normal">{children}</div>
      </div>
    </div>
  );
}
