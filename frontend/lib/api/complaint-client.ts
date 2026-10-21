import { getSessionToken } from "@/lib/auth/session";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
const API_ROOT = API_BASE_URL.endsWith("/api/v1")
  ? API_BASE_URL
  : `${API_BASE_URL}/api/v1`;

export interface CreateComplaintRequest {
  description: string;
  category: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  language?: "en" | "hi" | "mr";
  imageBase64?: string;
  imageContentType?: "image/jpeg" | "image/png" | "image/webp";
}

export interface BackendTimelineEntry {
  status: BackendComplaintStatus;
  note: string;
  author: string;
  createdAt: string;
}

export type BackendComplaintStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REJECTED";

export interface TrackedComplaint {
  id: string;
  trackingNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string | null;
  divisionId?: string;
  divisionName?: string;
  districtId?: string;
  districtName?: string;
  authorityId?: string;
  authorityName?: string;
  departmentId?: string | null;
  department?: { name: string } | null;
  location: string;
  region?: string;
  latitude?: number | null;
  longitude?: number | null;
  status: BackendComplaintStatus;
  priority: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW";
  assignedOfficerName?: string | null;
  assignedOfficerId?: string | null;
  citizen?: { name?: string | null; phoneNumber?: string } | null;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string | null;
  aiConfidence?: number | null;
  aiSuggestedCategory?: string | null;
  aiReasoning?: string | null;
  slaHours?: number;
  slaDeadline?: string;
  timeline?: BackendTimelineEntry[];
  resolutionRemarks?: string | null;
  resolutionImageUrl?: string | null;
}

export function getMyComplaintsApi(): Promise<TrackedComplaint[]> {
  return apiRequest<TrackedComplaint[]>("/complaints/my", {}, true);
}

export interface ComplaintChatResponse {
  tracking_number: string;
  answer: string;
  answer_language: string;
  status: Record<string, unknown>;
}

export interface VoiceTranscriptionResponse {
  text: string;
  language: "en" | "hi" | "mr";
  analysis: Record<string, unknown>;
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  requiresAuth = false
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (requiresAuth) {
    const token = getSessionToken();
    if (!token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error("Could not connect to CivicResolve. Please try again.");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `Request failed (${response.status}).`;
    const error = new Error(message) as Error & { statusCode: number };
    error.statusCode = response.status;
    throw error;
  }
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("data" in payload)
  ) {
    throw new Error("The backend returned an invalid response.");
  }
  return payload.data as T;
}

export function submitComplaintApi(
  complaint: CreateComplaintRequest
): Promise<TrackedComplaint> {
  return apiRequest<TrackedComplaint>(
    "/complaints",
    { method: "POST", body: JSON.stringify(complaint) },
    true
  );
}

export function transcribeComplaintAudioApi(
  audio: File
): Promise<VoiceTranscriptionResponse> {
  const body = new FormData();
  body.append("audio", audio);
  return apiRequest<VoiceTranscriptionResponse>(
    "/ai/voice/transcribe",
    { method: "POST", body },
    true
  );
}

export function trackComplaintApi(
  trackingNumber: string
): Promise<TrackedComplaint> {
  return apiRequest<TrackedComplaint>(
    `/complaints/track/${encodeURIComponent(trackingNumber)}`
  );
}

export function askComplaintAssistantApi(
  input: Pick<ComplaintChatResponse, "tracking_number"> & {
    question: string;
    language: "en" | "hi" | "mr";
  }
): Promise<ComplaintChatResponse> {
  return apiRequest<ComplaintChatResponse>("/ai/chatbot/complaint", {
    method: "POST",
    body: JSON.stringify({
      trackingNumber: input.tracking_number,
      question: input.question,
      language: input.language,
    }),
  });
}
