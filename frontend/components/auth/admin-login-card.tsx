"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Shield,
  Edit2,
  Lock,
  CheckCircle2,
  KeyRound,
  Sparkles,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PhoneInput } from "@/components/auth/phone-input";
import { OtpInput } from "@/components/auth/otp-input";
import { ResendTimer } from "@/components/auth/resend-timer";
import {
  isValidIndianMobile,
  maskMobileNumber,
  formatIndianMobile,
} from "@/lib/validations/auth";
import { sendAdminOtpApi, verifyAdminOtpApi, resendAdminOtpApi } from "@/lib/api/auth";
import { saveSession } from "@/lib/auth/session";
import Link from "next/link";

type LoginStep = "PHONE_INPUT" | "OTP_INPUT";

export function AdminLoginCard() {
  const router = useRouter();

  const [step, setStep] = useState<LoginStep>("PHONE_INPUT");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [otpSessionId, setOtpSessionId] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [demoHint, setDemoHint] = useState<string | null>(null);
  const [hasOtpError, setHasOtpError] = useState<boolean>(false);

  // STEP 1: Send Admin Security OTP
  const handleSendOtp = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanNumber = mobileNumber.replace(/\D/g, "");
    if (!isValidIndianMobile(cleanNumber)) {
      setErrorMessage("Please enter an authorized 10-digit administrative mobile number.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await sendAdminOtpApi(cleanNumber);
      setOtpSessionId(response.otpSessionId || "");
      if (response.devOtpHint) {
        setDemoHint(response.devOtpHint);
      }
      setSuccessNotice(`Authentication token dispatched to ${maskMobileNumber(cleanNumber)}`);
      setStep("OTP_INPUT");
      setOtp("");
      setHasOtpError(false);
    } catch (err: unknown) {
      const errText =
        err instanceof Error ? err.message : "Failed to verify administrative number. Access denied.";
      setErrorMessage(errText);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify 6-digit OTP and redirect to /admin/dashboard
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const finalOtp = codeToVerify || otp;
    setErrorMessage(null);
    setHasOtpError(false);

    if (finalOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit admin security code.");
      setHasOtpError(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyAdminOtpApi(mobileNumber, finalOtp, otpSessionId);

      // Persist Admin session
      saveSession(response.token, response.user);

      setSuccessNotice("Clearance granted. Initializing Department Administrative Dashboard...");

      // Smooth redirection to /admin/dashboard
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 900);
    } catch (err: unknown) {
      const errText =
        err instanceof Error
          ? err.message
          : "Invalid or expired administrative credentials. Please try again.";
      setErrorMessage(errText);
      setHasOtpError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Admin OTP
  const handleResendOtp = async () => {
    setIsResending(true);
    setErrorMessage(null);
    setHasOtpError(false);
    try {
      const response = await resendAdminOtpApi(mobileNumber);
      setOtpSessionId(response.otpSessionId || "");
      setSuccessNotice("A new 6-digit administrative token has been sent.");
      setOtp("");
    } catch (err: unknown) {
      const errText =
        err instanceof Error ? err.message : "Could not resend OTP. Please contact IT support.";
      setErrorMessage(errText);
    } finally {
      setIsResending(false);
    }
  };

  const handleEditMobile = () => {
    setStep("PHONE_INPUT");
    setOtp("");
    setErrorMessage(null);
    setSuccessNotice(null);
    setHasOtpError(false);
  };

  const isPhoneValid = isValidIndianMobile(mobileNumber);
  const isOtpValid = otp.length === 6;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle institutional top highlight banner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0B4EA2]" />

        {/* Header Badge */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-[#0B4EA2]">
              <Shield className="w-3.5 h-3.5 text-[#0B4EA2]" />
              ADMINISTRATIVE CONSOLE
            </span>
            <span className="text-[11px] bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] px-2 py-0.5 rounded font-bold">
              RESTRICTED
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            {step === "PHONE_INPUT" ? "Officer / Admin Sign In" : "Security Verification"}
          </h2>

          <p className="text-sm text-[#475569] mt-1.5 leading-relaxed">
            {step === "PHONE_INPUT"
              ? "Enter your government-registered officer mobile number to access administrative operations."
              : "Enter the 6-digit security token dispatched to your authorized officer mobile."}
          </p>
        </div>

        {/* Error / Feedback banners */}
        {errorMessage && (
          <div className="mb-5 animate-in fade-in slide-in-from-top-1 duration-200">
            <Alert variant="danger" title="Clearance Check Failed">
              {errorMessage}
            </Alert>
          </div>
        )}

        {successNotice && !errorMessage && (
          <div className="mb-5 animate-in fade-in slide-in-from-top-1 duration-200">
            <Alert variant="success" title="Verification Confirmed">
              {successNotice}
            </Alert>
          </div>
        )}

        {/* STEP 1: ADMIN MOBILE INPUT */}
        {step === "PHONE_INPUT" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isPhoneValid && !isLoading) handleSendOtp();
            }}
            className="space-y-5"
          >
            <PhoneInput
              value={mobileNumber}
              onChange={(val) => {
                setMobileNumber(val);
                if (errorMessage) setErrorMessage(null);
              }}
              error={null}
              disabled={isLoading}
              onEnterPress={handleSendOtp}
              autoFocus
            />

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2.5 text-xs text-[#64748B]">
              <KeyRound className="w-4 h-4 text-[#0B4EA2] shrink-0 mt-0.5" />
              <span>
                Access is restricted to authorized Municipal Officers, Department Heads, and System
                Administrators. All login attempts are audited with IP logging.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-base font-semibold"
              isLoading={isLoading}
              disabled={!isPhoneValid || isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Request Admin OTP
            </Button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === "OTP_INPUT" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isOtpValid && !isLoading) handleVerifyOtp();
            }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-left">
                <span className="block text-xs text-[#64748B]">Authorized Officer Mobile</span>
                <span className="text-sm font-semibold text-[#0F172A] tracking-wide">
                  +91 {formatIndianMobile(mobileNumber)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleEditMobile}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B4EA2] hover:text-[#083B7A] hover:underline p-1.5 rounded transition-colors"
                aria-label="Change mobile number"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Change</span>
              </button>
            </div>

            <div className="text-left space-y-1.5">
              <label className="block text-sm font-semibold text-[#0F172A]">
                6-Digit Security Token <span className="text-[#DC2626]">*</span>
              </label>

              <OtpInput
                length={6}
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  if (errorMessage) setErrorMessage(null);
                  if (hasOtpError) setHasOtpError(false);
                }}
                onComplete={(completedOtp) => {
                  handleVerifyOtp(completedOtp);
                }}
                disabled={isLoading}
                hasError={hasOtpError}
                autoFocus
              />
            </div>

            <ResendTimer
              initialSeconds={45}
              onResend={handleResendOtp}
              isResending={isResending}
              disabled={isLoading}
            />

            {demoHint && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F3E8FF] border border-[#DDD6FE] text-[#5B21B6] text-xs">
                <Sparkles className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <span className="font-semibold">Admin Demo:</span> Enter Security OTP{" "}
                  <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono font-bold text-[#5B21B6] border border-[#DDD6FE]">
                    {demoHint}
                  </code>{" "}
                  to grant access to the Admin Dashboard.
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-base font-semibold"
              isLoading={isLoading}
              disabled={!isOtpValid || isLoading}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Verify & Open Dashboard
            </Button>
          </form>
        )}

        {/* Portal Switch Link */}
        <div className="mt-6 pt-5 border-t border-[#E2E8F0] flex flex-col items-center gap-2 text-xs">
          <Link
            href="/auth/citizenlogin"
            className="text-[#0B4EA2] hover:text-[#083B7A] font-semibold flex items-center gap-1.5 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Switch to Citizen Grievance Portal
          </Link>
          <span className="text-[#64748B]">
            Complaint Intelligence Platform • Government Administrator Portal
          </span>
        </div>
      </div>
    </div>
  );
}
