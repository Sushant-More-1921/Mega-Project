import { z } from "zod";

/**
 * Validation schema for Indian Mobile Number.
 * Format: 10 digits starting with 6, 7, 8, or 9 (standard TRAI Indian mobile number allocation).
 */
export const mobileNumberSchema = z
  .string()
  .min(1, "Mobile number is required")
  .transform((val) => val.replace(/\D/g, "")) // Strip spaces, hyphens, non-digits
  .refine((val) => val.length === 10, {
    message: "Mobile number must be exactly 10 digits",
  })
  .refine((val) => /^[6-9]/.test(val), {
    message: "Indian mobile numbers must start with 6, 7, 8, or 9",
  });

/**
 * Validation schema for 6-digit OTP.
 */
export const otpSchema = z
  .string()
  .min(1, "Please enter the 6-digit verification code")
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length === 6, {
    message: "OTP must be exactly 6 digits",
  });

export type MobileNumberInput = z.infer<typeof mobileNumberSchema>;
export type OtpInput = z.infer<typeof otpSchema>;

/**
 * Helper to test if a raw string is a valid 10-digit Indian mobile number.
 */
export function isValidIndianMobile(raw: string): boolean {
  const cleaned = raw.replace(/\D/g, "");
  return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Format 10-digit mobile number nicely as 'XXXXX XXXXX' for display.
 */
export function formatIndianMobile(raw: string): string {
  const cleaned = raw.replace(/\D/g, "").slice(0, 10);
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
}

/**
 * Mask mobile number for privacy (e.g. +91 98*** **321).
 */
export function maskMobileNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) return phone;
  return `+91 ${digits.slice(0, 2)}*** ***${digits.slice(8)}`;
}
