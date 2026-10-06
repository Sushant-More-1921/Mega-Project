import React from "react";
import { ComplaintStatus } from "@/types/complaint";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
  size?: "sm" | "md";
}

/**
 * StatusBadge - Centralized status badge
 * Strict color mappings per Section 13 of complaint-system-frontend-README.md
 */
export function StatusBadge({
  status,
  className,
  size = "md",
}: StatusBadgeProps) {
  const statusConfig: Record<
    ComplaintStatus,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    SUBMITTED: {
      label: "SUBMITTED",
      bg: "bg-[#EAF2FF]",
      text: "text-[#0B4EA2]",
      border: "border-[#BFDBFE]",
      dot: "bg-[#0B4EA2]",
    },
    VALIDATING: {
      label: "VALIDATING",
      bg: "bg-[#F3E8FF]",
      text: "text-[#5B21B6]",
      border: "border-[#DDD6FE]",
      dot: "bg-[#5B21B6]",
    },
    ASSIGNED: {
      label: "ASSIGNED",
      bg: "bg-[#EAF2FF]",
      text: "text-[#0B4EA2]",
      border: "border-[#BFDBFE]",
      dot: "bg-[#0B4EA2]",
    },
    IN_PROGRESS: {
      label: "IN PROGRESS",
      bg: "bg-[#FFF7E6]",
      text: "text-[#B45309]",
      border: "border-[#FDE68A]",
      dot: "bg-[#F59E0B]",
    },
    RESOLVED: {
      label: "RESOLVED",
      bg: "bg-[#ECFDF3]",
      text: "text-[#15803D]",
      border: "border-[#BBF7D0]",
      dot: "bg-[#16A34A]",
    },
    CITIZEN_VERIFICATION: {
      label: "CITIZEN VERIFY",
      bg: "bg-[#ECFEFF]",
      text: "text-[#0F766E]",
      border: "border-[#99F6E4]",
      dot: "bg-[#0F766E]",
    },
    CLOSED: {
      label: "CLOSED",
      bg: "bg-[#ECFDF3]",
      text: "text-[#15803D]",
      border: "border-[#BBF7D0]",
      dot: "bg-[#16A34A]",
    },
    REOPENED: {
      label: "REOPENED",
      bg: "bg-[#FFF7E6]",
      text: "text-[#B45309]",
      border: "border-[#FDE68A]",
      dot: "bg-[#F59E0B]",
    },
    ESCALATED: {
      label: "ESCALATED",
      bg: "bg-[#FEF2F2]",
      text: "text-[#DC2626]",
      border: "border-[#FECACA]",
      dot: "bg-[#DC2626]",
    },
  };

  const current = statusConfig[status] || statusConfig.SUBMITTED;

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] gap-1"
      : "px-2.5 py-1 text-xs gap-1.5 font-semibold";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium tracking-wide uppercase select-none",
        current.bg,
        current.text,
        current.border,
        sizeClasses,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", current.dot)} />
      {current.label}
    </span>
  );
}
