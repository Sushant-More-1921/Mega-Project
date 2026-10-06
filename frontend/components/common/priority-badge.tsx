import React from "react";
import { ComplaintPriority } from "@/types/complaint";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md";
}

/**
 * PriorityBadge - Centralized priority indicator
 * Strict color mappings per Section 14 of complaint-system-frontend-README.md
 * VERY_HIGH -> Red, HIGH -> Orange, MEDIUM -> Blue, LOW -> Green
 */
export function PriorityBadge({
  priority,
  className,
  showIcon = true,
  size = "md",
}: PriorityBadgeProps) {
  const configs: Record<
    ComplaintPriority,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    VERY_HIGH: {
      label: "VERY HIGH",
      bg: "bg-[#FEF2F2]",
      text: "text-[#DC2626]",
      border: "border-[#FECACA]",
      icon: <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#DC2626]" />,
    },
    HIGH: {
      label: "HIGH",
      bg: "bg-[#FFF7E6]",
      text: "text-[#B45309]",
      border: "border-[#FDE68A]",
      icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#F59E0B]" />,
    },
    MEDIUM: {
      label: "MEDIUM",
      bg: "bg-[#EAF2FF]",
      text: "text-[#0B4EA2]",
      border: "border-[#BFDBFE]",
      icon: <ArrowUp className="w-3.5 h-3.5 shrink-0 text-[#0B4EA2]" />,
    },
    LOW: {
      label: "LOW",
      bg: "bg-[#ECFDF3]",
      text: "text-[#15803D]",
      border: "border-[#BBF7D0]",
      icon: <ArrowDown className="w-3.5 h-3.5 shrink-0 text-[#16A34A]" />,
    },
  };

  const current = configs[priority] || configs.MEDIUM;

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] gap-1"
      : "px-2.5 py-1 text-xs gap-1.5 font-bold";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border tracking-wider uppercase select-none",
        current.bg,
        current.text,
        current.border,
        sizeClasses,
        className
      )}
    >
      {showIcon && current.icon}
      <span>{current.label}</span>
    </span>
  );
}
