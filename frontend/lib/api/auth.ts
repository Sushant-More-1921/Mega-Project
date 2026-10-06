/**
 * Authentication API Service
 * Modular client for OTP sending, verification, and session persistence.
 * Ready for drop-in backend connection via NEXT_PUBLIC_API_URL.
 */

import {
  SendOtpResponse,
  VerifyOtpResponse,
  AuthUser,
} from "@/types/auth";
import { isValidIndianMobile, maskMobileNumber } from "@/lib/validations/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Standard simulated delay for smooth UX loading states when backend is offline
 */
const simulateDelay = (ms = 750) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send OTP to a Citizen mobile number.
 */
export async function sendOtpApi(mobileNumber: string): Promise<SendOtpResponse> {
  const cleanNumber = mobileNumber.replace(/\D/g, "");

  if (!isValidIndianMobile(cleanNumber)) {
    throw new Error("Invalid mobile number. Must be a 10-digit Indian number starting with 6-9.");
  }

  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobileNumber: `+91${cleanNumber}` }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to send OTP. Please try again.");
    }
    return data;
  }

  await simulateDelay(800);

  if (cleanNumber === "9000000000") {
    throw new Error("SMS gateway service temporarily unavailable. Please try again later.");
  }

  return {
    success: true,
    message: `OTP sent successfully to ${maskMobileNumber(cleanNumber)}`,
    expiresInSeconds: 60,
    maskedMobile: maskMobileNumber(cleanNumber),
    otpSessionId: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    devOtpHint: "123456",
  };
}

/**
 * Verify Citizen 6-digit OTP.
 */
export async function verifyOtpApi(
  mobileNumber: string,
  otp: string,
  otpSessionId?: string
): Promise<VerifyOtpResponse> {
  const cleanNumber = mobileNumber.replace(/\D/g, "");
  const cleanOtp = otp.trim();

  if (cleanOtp.length !== 6) {
    throw new Error("Verification code must be exactly 6 digits.");
  }

  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobileNumber: `+91${cleanNumber}`,
        otp: cleanOtp,
        otpSessionId,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Invalid or expired OTP. Please try again.");
    }
    return data;
  }

  await simulateDelay(850);

  if (cleanOtp === "000000" || (cleanOtp !== "123456" && cleanOtp !== "654321")) {
    throw new Error("Invalid OTP code. Please check the 6 digits or click Resend OTP.");
  }

  const mockUser: AuthUser = {
    id: `usr_${Date.now().toString(36)}`,
    mobileNumber: `+91${cleanNumber}`,
    role: "CITIZEN",
    name: "Verified Citizen",
    isVerified: true,
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    message: "Mobile number verified successfully.",
    token: `cip_jwt_${Math.random().toString(36).substring(2)}_${Date.now()}`,
    user: mockUser,
  };
}

/**
 * Resend Citizen OTP.
 */
export async function resendOtpApi(mobileNumber: string): Promise<SendOtpResponse> {
  return sendOtpApi(mobileNumber);
}

/**
 * Send OTP for Administrator Login.
 * Verifies mobile number against admin authorized clearance.
 */
export async function sendAdminOtpApi(mobileNumber: string): Promise<SendOtpResponse> {
  const cleanNumber = mobileNumber.replace(/\D/g, "");

  if (!isValidIndianMobile(cleanNumber)) {
    throw new Error("Invalid administrative mobile number. Must be a 10-digit Indian number.");
  }

  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/admin/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobileNumber: `+91${cleanNumber}`, portal: "ADMIN" }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Admin authentication failed. Unauthorized number.");
    }
    return data;
  }

  await simulateDelay(850);

  // Simulated unauthorized number for testing admin access denial
  if (cleanNumber === "9999999999") {
    throw new Error("Access Denied: This mobile number is not registered in the Admin Directorate Directory.");
  }

  return {
    success: true,
    message: `Security OTP sent to Authorized Admin ${maskMobileNumber(cleanNumber)}`,
    expiresInSeconds: 60,
    maskedMobile: maskMobileNumber(cleanNumber),
    otpSessionId: `adm_sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    devOtpHint: "123456",
  };
}

/**
 * Verify Administrator OTP and return Admin Session.
 */
export async function verifyAdminOtpApi(
  mobileNumber: string,
  otp: string,
  otpSessionId?: string
): Promise<VerifyOtpResponse> {
  const cleanNumber = mobileNumber.replace(/\D/g, "");
  const cleanOtp = otp.trim();

  if (cleanOtp.length !== 6) {
    throw new Error("Administrative 2FA code must be exactly 6 digits.");
  }

  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/admin/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobileNumber: `+91${cleanNumber}`,
        otp: cleanOtp,
        otpSessionId,
        portal: "ADMIN",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Invalid Admin OTP credentials.");
    }
    return data;
  }

  await simulateDelay(900);

  if (cleanOtp === "000000" || (cleanOtp !== "123456" && cleanOtp !== "654321")) {
    throw new Error("Invalid Administrative Security Code. Verification failed.");
  }

  const mockAdminUser: AuthUser = {
    id: `adm_${Date.now().toString(36)}`,
    mobileNumber: `+91${cleanNumber}`,
    role: "ADMIN",
    name: "Rajesh Sharma",
    designation: "Chief Grievance Redressal Administrator",
    department: "Municipal Affairs & Intelligence Directorate",
    badgeId: "ADM-HQ-401",
    isVerified: true,
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    message: "Administrative clearance verified successfully.",
    token: `cip_adm_jwt_${Math.random().toString(36).substring(2)}_${Date.now()}`,
    user: mockAdminUser,
  };
}

/**
 * Resend Admin OTP.
 */
export async function resendAdminOtpApi(mobileNumber: string): Promise<SendOtpResponse> {
  return sendAdminOtpApi(mobileNumber);
}
