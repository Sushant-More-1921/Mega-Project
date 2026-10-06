/**
 * CivicResolve Real-Time Event Bus
 * Uses Browser CustomEvents and BroadcastChannel for immediate cross-tab and in-tab synchronization.
 * Supports events:
 * - 'COMPLAINT_CLUSTERED'
 * - 'NEW_INCIDENT_CREATED'
 * - 'OFFICER_ASSIGNED'
 * - 'STATUS_CHANGED'
 * - 'CASE_RESOLVED'
 * - 'DATABASE_RESET'
 */

export type RealTimeEventType =
  | "COMPLAINT_CLUSTERED"
  | "NEW_INCIDENT_CREATED"
  | "OFFICER_ASSIGNED"
  | "STATUS_CHANGED"
  | "CASE_RESOLVED"
  | "DATABASE_RESET";

export interface RealTimePayload {
  type: RealTimeEventType;
  timestamp: number;
  incidentId?: string;
  incidentNumber?: string;
  complaintCount?: number;
  message?: string;
  data?: any;
}

const CHANNEL_NAME = "civicresolve_realtime_channel";
const EVENT_NAME = "civicresolve:realtime-event";

let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn("BroadcastChannel initialization skipped", e);
  }
}

/**
 * Broadcasts an update across all open tabs and components in real-time
 */
export function emitRealTimeEvent(type: RealTimeEventType, data?: Record<string, any>): void {
  const payload: RealTimePayload = {
    type,
    timestamp: Date.now(),
    ...data,
  };

  if (typeof window !== "undefined") {
    // 1. Dispatch in current window
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));

    // 2. Broadcast across tabs
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(payload);
      } catch (e) {
        console.warn("Failed posting to BroadcastChannel", e);
      }
    }
  }
}

/**
 * Subscribes a React component to live real-time dashboard events
 */
export function subscribeToRealTime(callback: (payload: RealTimePayload) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<RealTimePayload>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  const handleBroadcastMessage = (event: MessageEvent<RealTimePayload>) => {
    if (event.data) {
      callback(event.data);
    }
  };

  window.addEventListener(EVENT_NAME, handleCustomEvent);

  if (broadcastChannel) {
    broadcastChannel.addEventListener("message", handleBroadcastMessage);
  }

  // Return unsubscribe cleanup function
  return () => {
    window.removeEventListener(EVENT_NAME, handleCustomEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener("message", handleBroadcastMessage);
    }
  };
}
