import { env } from '../../config/env';
import { createHash } from 'crypto';

export interface AIAnalysis {
  complaint: string;
  language: string;
  normalized_text: string;
  category: string;
  category_confidence: number;
  category_status: 'confident' | 'low_confidence';
  manual_review: boolean;
  top_predictions: Array<{ category: string; confidence: number }>;
  priority: string;
  priority_confidence: number;
  severity_score: number;
  priority_source: string;
  duplicate_detection: {
    possible_duplicate?: boolean;
    duplicate_score?: number;
    best_match?: {
      complaint_id?: string | number;
      issue_cluster_id?: string;
    } | null;
    issue_cluster?: {
      issue_cluster_id?: string;
      duplicate_of?: string | number | null;
    };
  } | null;
  issue_cluster_id: string | null;
  hotspot_count: number;
  hotspots: unknown[];
}

export interface AIComplaintContext {
  id: string;
  citizen_id: string;
  text: string;
  latitude: number;
  longitude: number;
  category: string;
  issue_cluster_id: string | null;
  created_at: string;
  status: string;
}

export interface AIClusterContext {
  issue_cluster_id: string;
  category: string | null;
  location: { latitude: number; longitude: number };
  report_count: number;
  unique_citizen_count: number;
}

export class AIServiceError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode = 503, options?: ErrorOptions) {
    super(message, options);
    this.statusCode = statusCode;
    this.name = 'AIServiceError';
  }
}

export class AIService {
  private async post<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      env.AI_SERVICE_TIMEOUT_MS
    );

    try {
      const response = await fetch(
        `${env.AI_SERVICE_URL.replace(/\/+$/, '')}${path}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );

      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const detail =
          typeof payload === 'object' &&
          payload !== null &&
          'detail' in payload &&
          typeof payload.detail === 'string'
            ? payload.detail
            : `AI service returned HTTP ${response.status}.`;
        const statusCode =
          response.status === 400 || response.status === 413 ? response.status : 503;
        throw new AIServiceError(detail, statusCode);
      }

      if (typeof payload !== 'object' || payload === null) {
        throw new AIServiceError('AI service returned an invalid response.');
      }
      return payload as T;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceError('AI service request timed out.', 503, { cause: error });
      }
      throw new AIServiceError('AI service is unavailable.', 503, { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  }

  public analyzeComplaint(input: {
    text: string;
    language?: string;
    latitude?: number;
    longitude?: number;
    complaintId: string;
    citizenId: string;
    previousComplaints: AIComplaintContext[];
    issueClusters: AIClusterContext[];
  }): Promise<AIAnalysis> {
    return this.post<AIAnalysis>('/analyze', {
      text: input.text,
      language: input.language,
      latitude: input.latitude,
      longitude: input.longitude,
      complaint_id: input.complaintId,
      citizen_id: input.citizenId,
      previous_complaints: input.previousComplaints,
      issue_clusters: input.issueClusters,
    });
  }

  public askAboutComplaint(input: {
    trackingNumber: string;
    question: string;
    language: 'en' | 'hi' | 'mr';
  }): Promise<{ tracking_number: string; status: Record<string, unknown>; answer: string; answer_language: string }> {
    return this.post('/chatbot/complaint', {
      tracking_number: input.trackingNumber,
      question: input.question,
      language: input.language,
    });
  }

  public analyzeImage(input: {
    imageBase64: string;
    contentType: 'image/jpeg' | 'image/png' | 'image/webp';
    text: string;
    language?: string;
  }): Promise<{ image_description: string; analysis: AIAnalysis }> {
    return this.post('/image/analyze', {
      image_base64: input.imageBase64,
      content_type: input.contentType,
      text: input.text,
      language: input.language,
    });
  }

  public async transcribeAudio(
    file: Express.Multer.File
  ): Promise<{ text: string; language: string; analysis: AIAnalysis }> {
    const form = new FormData();
    form.append(
      'audio',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
      file.originalname
    );
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      env.AI_SERVICE_TIMEOUT_MS
    );

    try {
      const response = await fetch(
        `${env.AI_SERVICE_URL.replace(/\/+$/, '')}/voice/transcribe`,
        { method: 'POST', body: form, signal: controller.signal }
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const detail =
          typeof payload === 'object' &&
          payload !== null &&
          'detail' in payload &&
          typeof payload.detail === 'string'
            ? payload.detail
            : `AI service returned HTTP ${response.status}.`;
        const statusCode =
          response.status === 400 || response.status === 413 ? response.status : 503;
        throw new AIServiceError(detail, statusCode);
      }
      if (typeof payload !== 'object' || payload === null) {
        throw new AIServiceError('AI service returned an invalid response.');
      }
      return payload as { text: string; language: string; analysis: AIAnalysis };
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceError('AI service request timed out.', 503, { cause: error });
      }
      throw new AIServiceError('AI service is unavailable.', 503, { cause: error });
    } finally {
      clearTimeout(timeout);
    }

  }

  public async uploadComplaintImage(
    imageBase64: string,
    contentType: 'image/jpeg' | 'image/png' | 'image/webp'
  ): Promise<string> {
    const { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } = env;
    if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET || !CLOUDINARY_CLOUD_NAME) {
      throw new AIServiceError(
        'Photo evidence requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to be configured.',
        503
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1')
      .update(`timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
      .digest('hex');
    const form = new FormData();
    form.append('api_key', CLOUDINARY_API_KEY);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);
    form.append(
      'file',
      new Blob([new Uint8Array(Buffer.from(imageBase64, 'base64'))], { type: contentType }),
      'complaint-evidence'
    );

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      env.AI_SERVICE_TIMEOUT_MS
    );
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY_CLOUD_NAME)}/image/upload`,
        { method: 'POST', body: form, signal: controller.signal }
      );
      const payload: unknown = await response.json().catch(() => null);
      if (
        !response.ok ||
        typeof payload !== 'object' ||
        payload === null ||
        !('secure_url' in payload) ||
        typeof payload.secure_url !== 'string'
      ) {
        throw new AIServiceError('Photo evidence could not be stored.', 502);
      }
      return payload.secure_url;
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceError('Photo storage request timed out.', 503, { cause: error });
      }
      throw new AIServiceError('Photo storage is unavailable.', 503, { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const aiService = new AIService();
