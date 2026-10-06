/**
 * CivicResolve Automated Complaint Clustering Engine
 *
 * Algorithm Rules:
 * 1. Proximity: Geo-distance <= 450 meters (Haversine) OR location landmark match.
 * 2. Semantic Similarity: Matching category and high keyword overlap.
 * 3. Time Window: Reports within 72 hours of active incident.
 *
 * Actions on Match:
 * - Link citizen report to existing master incident.
 * - Increment complaintCount.
 * - Update lastReportedAt.
 * - Recalculate priority based on citizen volume.
 * - Do NOT create an extra active case for the field officer.
 */

import { MasterIncident, CitizenReport, ClusterEvaluationResult } from "@/types/incident";
import { ComplaintPriority } from "@/types/complaint";

/**
 * Calculates geographic distance in meters between two lat/lng coordinates (Haversine Formula)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Normalizes text and extracts key tokens for semantic similarity
 */
function extractTokens(text: string): Set<string> {
  const stopWords = new Set([
    "the", "is", "at", "which", "on", "a", "an", "and", "or", "near", "near by",
    "in", "front", "of", "to", "for", "with", "this", "that", "there", "has", "have",
    "please", "very", "urgent", "problem", "issue", "causing"
  ]);

  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w))
  );
}

/**
 * Computes Jaccard keyword overlap similarity between two text strings [0.0 - 1.0]
 */
export function calculateKeywordSimilarity(textA: string, textB: string): number {
  const tokensA = extractTokens(textA);
  const tokensB = extractTokens(textB);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection++;
  });

  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Checks whether an incoming citizen report matches an active master incident
 */
export function evaluateReportMatch(
  newReport: {
    category: string;
    description: string;
    location: string;
    coordinates: { lat: number; lng: number };
    timestamp: number;
  },
  incident: MasterIncident
): ClusterEvaluationResult {
  // Only cluster into non-closed incidents
  if (incident.status === "CLOSED" || incident.status === "RESOLVED") {
    return {
      isMatch: false,
      matchScore: 0,
      reason: "Incident is already closed or resolved",
    };
  }

  // 1. Time Window check (<= 72 hours)
  const hoursDifference = Math.abs(newReport.timestamp - incident.lastReportedTimestamp) / (1000 * 60 * 60);
  if (hoursDifference > 72) {
    return {
      isMatch: false,
      matchScore: 0,
      reason: `Time window exceeded (${hoursDifference.toFixed(1)} hrs > 72 hrs)`,
    };
  }

  // 2. Category compatibility
  const normCatNew = newReport.category.toLowerCase().trim();
  const normCatInc = incident.category.toLowerCase().trim();
  const categoryMatches =
    normCatNew === normCatInc ||
    normCatNew.includes(normCatInc) ||
    normCatInc.includes(normCatNew);

  if (!categoryMatches) {
    return {
      isMatch: false,
      matchScore: 0,
      reason: "Different civic categories",
    };
  }

  // 3. Geographic proximity
  const distanceMeters = calculateHaversineDistance(
    newReport.coordinates.lat,
    newReport.coordinates.lng,
    incident.coordinates.lat,
    incident.coordinates.lng
  );

  const proximityThreshold = 450; // 450 meters
  const isWithinProximity = distanceMeters <= proximityThreshold;

  // 4. Keyword / Location similarity
  const textSim = calculateKeywordSimilarity(newReport.description, incident.description);
  const locationSim = calculateKeywordSimilarity(newReport.location, incident.location);

  // Overall match scoring
  // Distance score: 1.0 at 0m, decaying to 0.0 at 450m
  const distanceScore = Math.max(0, 1 - distanceMeters / proximityThreshold);
  const weightedScore = distanceScore * 0.5 + textSim * 0.3 + locationSim * 0.2;

  const isMatch = isWithinProximity && (weightedScore >= 0.35 || textSim >= 0.25 || locationSim >= 0.4);

  return {
    isMatch,
    incidentId: incident.id,
    matchScore: weightedScore,
    reason: isMatch
      ? `Clustered: Distance ${Math.round(distanceMeters)}m <= 450m, Keyword similarity ${(textSim * 100).toFixed(0)}%`
      : `No match: Distance ${Math.round(distanceMeters)}m, Score ${(weightedScore * 100).toFixed(0)}%`,
  };
}

/**
 * Dynamically elevates incident priority as supporting citizen report volume climbs
 */
export function recalculateIncidentPriority(
  currentCount: number,
  currentPriority: ComplaintPriority
): ComplaintPriority {
  // If 15+ citizens report the same issue, it is a critical neighborhood emergency
  if (currentCount >= 15) {
    return "VERY_HIGH";
  }
  // If 5+ citizens report, elevate to at least HIGH
  if (currentCount >= 5) {
    return currentPriority === "VERY_HIGH" ? "VERY_HIGH" : "HIGH";
  }
  // If 3+ citizens report, elevate to at least MEDIUM
  if (currentCount >= 3) {
    if (currentPriority === "VERY_HIGH" || currentPriority === "HIGH") {
      return currentPriority;
    }
    return "MEDIUM";
  }
  return currentPriority;
}
