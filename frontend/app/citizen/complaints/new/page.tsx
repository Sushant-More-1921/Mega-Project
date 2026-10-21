"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Shield,
  UserCheck,
  MapPin,
  Camera,
  Mic,
  Send,
  Sparkles,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionUser, clearSession } from "@/lib/auth/session";
import { AuthUser } from "@/types/auth";
import {
  submitComplaintApi,
  transcribeComplaintAudioApi,
} from "@/lib/api/complaint-client";
import Link from "next/link";

type ComplaintImageType = "image/jpeg" | "image/png" | "image/webp";

function isComplaintImageType(type: string): type is ComplaintImageType {
  return type === "image/jpeg" || type === "image/png" || type === "image/webp";
}

export default function NewComplaintPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTrackingNumber, setSubmittedTrackingNumber] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<"en" | "hi" | "mr" | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioName, setAudioName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const readImageAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          reject(new Error("Could not read the selected image."));
          return;
        }
        resolve(reader.result.split(",", 2)[1]);
      };
      reader.onerror = () => reject(new Error("Could not read the selected image."));
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    const sessionUser = getSessionUser();
    const timer = window.setTimeout(() => {
      if (sessionUser) setUser(sessionUser);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/auth/citizenlogin");
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setSubmissionError("Location services are not available in this browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocating(false);
        setSubmissionError(null);
      },
      () => {
        setIsLocating(false);
        setSubmissionError("Location could not be detected. You can still submit the complaint.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionError(null);
    setSubmittedTrackingNumber(null);
    if (!user) {
      setSubmissionError("Please sign in again before submitting a complaint.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const category = String(form.get("category") || "");
    setIsSubmitting(true);
    try {
      let imageFields: {
        imageBase64?: string;
        imageContentType?: ComplaintImageType;
      } = {};
      if (image) {
        if (!isComplaintImageType(image.type)) {
          throw new Error("Choose a JPEG, PNG, or WebP photo.");
        }
        imageFields = {
          imageBase64: await readImageAsBase64(image),
          imageContentType: image.type,
        };
      }
      const complaint = await submitComplaintApi({
        description,
        category,
        ...(language ? { language } : {}),
        ...imageFields,
        ...(location || {}),
      });
      setSubmittedTrackingNumber(complaint.trackingNumber);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Complaint submission failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAudioSelection = async (file?: File) => {
    if (!file) return;
    setSubmissionError(null);
    setIsTranscribing(true);
    setAudioName(file.name);
    try {
      const result = await transcribeComplaintAudioApi(file);
      setDescription((current) =>
        current.trim() ? `${current.trim()}\n${result.text}` : result.text
      );
      setLanguage(result.language);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Audio transcription failed."
      );
      setAudioName("");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleImageSelection = (file?: File) => {
    setSubmissionError(null);
    if (!file) {
      setImage(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImage(null);
      setSubmissionError("Choose a JPEG, PNG, or WebP photo.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setImage(null);
      setSubmissionError("Photo must be smaller than 8 MB.");
      return;
    }
    setImage(file);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-[#E2E8F0] py-3 px-4 sm:px-8 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0B4EA2] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block text-sm sm:text-base font-bold text-[#0F172A] leading-tight">
                Complaint Intelligence Platform
              </span>
              <span className="block text-[11px] font-medium text-[#64748B]">
                Citizen Grievance Submission Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-[#EAF2FF] border border-[#BFDBFE] px-3 py-1.5 rounded-lg text-xs font-medium text-[#0B4EA2]">
                <UserCheck className="w-4 h-4 text-[#0B4EA2]" />
                <span className="font-semibold">{user.mobileNumber}</span>
                <span className="hidden sm:inline text-[#16A34A] bg-[#ECFDF3] px-1.5 py-0.5 rounded text-[10px] font-bold">
                  VERIFIED
                </span>
              </div>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs"
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-3xl w-full mx-auto py-8 px-4 sm:px-6 flex-1">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#64748B] mb-4">
          <Link
            href="/auth/citizenlogin"
            className="hover:text-[#0B4EA2] flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
          <span>/</span>
          <span className="text-[#0F172A] font-semibold">New Complaint</span>
        </div>

        {/* Success Banner upon OTP Login */}
        <div className="mb-6 bg-[#ECFDF3] border border-[#BBF7D0] text-[#15803D] p-4 rounded-xl flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0">
            ✓
          </div>
          <div>
            <h4 className="font-bold text-sm">Authentication Successful!</h4>
            <p className="text-xs text-[#15803D] mt-0.5">
              You are logged in via OTP verification. You can now lodge your official civic grievance below.
            </p>
          </div>
        </div>

        {/* Complaint Submission Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
          <div className="border-b border-[#E2E8F0] pb-5 mb-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B4EA2] bg-[#EAF2FF] px-2.5 py-1 rounded-md mb-2">
              <FileText className="w-3.5 h-3.5" /> LODGE CITIZEN GRIEVANCE
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
              Submit a New Civic Complaint
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Provide incident details. Our AI engine will automatically classify, assess priority, and route to the concerned municipal department.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                Grievance Category <span className="text-[#DC2626]">*</span>
              </label>
              <select
                name="category"
                required
                className="w-full h-11 px-3.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#0B4EA2] focus:ring-2 focus:ring-[#EAF2FF]"
              >
                <option value="">Select category...</option>
                <option value="waste">Solid Waste / Garbage Disposal</option>
                <option value="roads">Potholes & Road Maintenance</option>
                <option value="water">Water Supply & Leakage</option>
                <option value="drainage">Sewage & Drainage Overflow</option>
                <option value="streetlights">Streetlight Malfunction</option>
                <option value="other">Other Civic Issue</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                Complaint Description <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                rows={4}
                placeholder="Describe the issue in detail (location, severity, duration)..."
                className="w-full p-3.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:border-[#0B4EA2] focus:ring-2 focus:ring-[#EAF2FF] resize-none"
              ></textarea>
              <p className="text-xs text-[#64748B] mt-1">
                Be specific with landmarks or nearby public structures to speed up resolution.
              </p>
              <input
                ref={audioInput}
                type="file"
                accept=".flac,.m4a,.mp3,.mp4,.mpeg,.ogg,.wav,.webm"
                className="hidden"
                onChange={(event) => void handleAudioSelection(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => audioInput.current?.click()}
                disabled={isTranscribing || isSubmitting}
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#0B4EA2] disabled:opacity-60"
              >
                <Mic className="w-4 h-4" />
                {isTranscribing ? "Transcribing audio..." : "Add voice recording"}
              </button>
              {audioName && !isTranscribing && (
                <span className="ml-2 text-xs text-[#64748B]">
                  {audioName} · {language?.toUpperCase() || "EN"} transcript
                </span>
              )}
            </div>

            {/* AI Assistant Preview Box */}
            <div className="p-4 rounded-xl bg-[#F3E8FF] border border-[#DDD6FE] text-[#5B21B6] space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="w-4 h-4 text-[#5B21B6]" />
                <span>AI Automated Intake Assistant</span>
              </div>
              <p className="text-xs text-[#5B21B6]/90 leading-relaxed">
                Our NLP models will analyze your text upon submission to automatically identify severity, detect duplicate issues in your neighborhood, and ping the field officer directly.
              </p>
            </div>

            {/* Location & Multimedia Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleLocate}
                className="w-full text-left p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-3"
              >
                <MapPin className="w-5 h-5 text-[#0B4EA2]" />
                <div className="text-left text-xs">
                  <span className="font-semibold text-[#0F172A] block">Auto GPS Location</span>
                  <span className="text-[#64748B]">
                    {isLocating
                      ? "Detecting coordinates..."
                      : location
                        ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                        : "Tap to detect location (optional)"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => imageInput.current?.click()}
                disabled={isSubmitting}
                className="w-full text-left p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-3 disabled:opacity-60"
              >
                <Camera className="w-5 h-5 text-[#0B4EA2]" />
                <div className="text-left text-xs">
                  <span className="font-semibold text-[#0F172A] block">Attach Geo-tagged Photo</span>
                  <span className="text-[#64748B]">
                    {image ? image.name : "Optional image proof (JPEG, PNG, WebP; max 8 MB)"}
                  </span>
                </div>
              </button>
              <input
                ref={imageInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => handleImageSelection(event.target.files?.[0])}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <Link href="/auth/citizenlogin">
                <Button variant="ghost" size="md">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Submit Grievance
              </Button>
            </div>
          </form>

          {submissionError && (
            <div role="alert" className="mt-6 p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-sm text-center font-medium">
              {submissionError}
            </div>
          )}

          {submittedTrackingNumber && (
            <div className="mt-6 p-4 rounded-lg bg-[#ECFDF3] border border-[#BBF7D0] text-[#15803D] text-sm text-center font-medium">
              Grievance {submittedTrackingNumber} registered successfully. AI classified it and the backend saved the complaint.
              <Link
                href={`/complaints/track?id=${encodeURIComponent(submittedTrackingNumber)}`}
                className="ml-1 underline font-bold"
              >
                Track status
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-[#E2E8F0] py-4 px-4 text-center text-xs text-[#64748B]">
        Complaint Intelligence Platform • Government of India Public Services
      </footer>
    </div>
  );
}
