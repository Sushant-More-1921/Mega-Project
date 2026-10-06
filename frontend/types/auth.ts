/**
 * Authentication and User Types
 * Centralized types for OTP authentication flow.
 */

export type UserRole = "CITIZEN" | "OFFICER" | "ADMIN";

export interface AuthUser {
  id: string;
  mobileNumber: string;
  role: UserRole;
  name?: string;
  isVerified: boolean;
  department?: string;
  badgeId?: string;
  designation?: string;
  createdAt?: string;
}

export interface SendOtpRequest {
  mobileNumber: string;
  portal?: "CITIZEN" | "ADMIN" | "OFFICER";
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  expiresInSeconds: number;
  maskedMobile: string;
  otpSessionId?: string;
  /** For development/demo convenience: demo code indicated when in demo mode */
  devOtpHint?: string;
}

export interface VerifyOtpRequest {
  mobileNumber: string;
  otp: string;
  otpSessionId?: string;
  portal?: "CITIZEN" | "ADMIN" | "OFFICER";
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
}
