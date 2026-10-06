"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import {
  MapPin,
  Layers,
  Flame,
  ZoomIn,
  ZoomOut,
  Navigation,
  Compass,
  Maximize2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Users,
  Shield,
  Key,
  ChevronRight,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/common/priority-badge";
import { StatusBadge } from "@/components/common/status-badge";
import {
  MasterIncident,
  MapIncidentItem,
  MapHotspotItem,
  MapClusterItem,
  IncidentFilterParams,
} from "@/types/incident";
import {
  getStoredIncidents,
  getMapIncidents,
  getMapHotspots,
  getMapClusters,
  incidentToComplaint,
} from "@/lib/db/incidents-db";
import { subscribeToRealTime } from "@/lib/realtime/events";
import {
  INITIAL_DIVISIONS,
  INITIAL_AUTHORITIES,
  INITIAL_DEPARTMENTS,
} from "@/lib/api/hierarchy";
import { cn } from "@/lib/utils";

interface GoogleMapsDashboardProps {
  incidents?: MasterIncident[];
  onSelectIncident?: (incident: MasterIncident) => void;
  className?: string;
  userJurisdiction?: {
    divisionId?: string;
    authorityId?: string;
    departmentId?: string;
  };
}

export function GoogleMapsDashboard({
  incidents: propIncidents,
  onSelectIncident,
  className,
  userJurisdiction,
}: GoogleMapsDashboardProps) {
  // Map Container Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const userLocationMarkerRef = useRef<google.maps.Marker | null>(null);

  // API Key State: Checks env var or runtime key stored in session/localStorage
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("CIVICRESOLVE_GMAPS_KEY");
      if (stored) return stored;
    }
    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  });
  const [customKeyInput, setCustomKeyInput] = useState("");
  const [isKeySaving, setIsKeySaving] = useState(false);

  // Map Loading / Error State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  // Map Layer Toggles
  const [showHotspots, setShowHotspots] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [selectedIncidentItem, setSelectedIncidentItem] = useState<MapIncidentItem | null>(null);

  // Filter States
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(
    userJurisdiction?.divisionId || "ALL"
  );
  const [selectedAuthorityId, setSelectedAuthorityId] = useState<string>(
    userJurisdiction?.authorityId || "ALL"
  );
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    userJurisdiction?.departmentId || "ALL"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchLocationQuery, setSearchLocationQuery] = useState("");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Incidents Data (from database or props)
  const [storedIncidents, setStoredIncidents] = useState<MasterIncident[]>([]);

  const refreshData = useCallback(() => {
    const data = getStoredIncidents();
    setStoredIncidents([...data]);
  }, []);

  useEffect(() => {
    refreshData();
    const unsub = subscribeToRealTime(() => {
      refreshData();
    });
    return () => unsub();
  }, [refreshData]);

  const activeIncidents = propIncidents || storedIncidents;

  // Filter params based on active selections & jurisdiction
  const filterParams: IncidentFilterParams = useMemo(
    () => ({
      divisionId: selectedDivisionId !== "ALL" ? selectedDivisionId : userJurisdiction?.divisionId,
      authorityId: selectedAuthorityId !== "ALL" ? selectedAuthorityId : userJurisdiction?.authorityId,
      departmentId: selectedDepartmentId !== "ALL" ? selectedDepartmentId : userJurisdiction?.departmentId,
      priority: selectedPriority !== "ALL" ? selectedPriority : undefined,
      status: selectedStatus !== "ALL" ? selectedStatus : undefined,
      search: searchLocationQuery || undefined,
    }),
    [
      selectedDivisionId,
      selectedAuthorityId,
      selectedDepartmentId,
      selectedPriority,
      selectedStatus,
      searchLocationQuery,
      userJurisdiction,
    ]
  );

  // Derived Map Data directly from database engine
  const mapIncidents: MapIncidentItem[] = useMemo(() => {
    let items = getMapIncidents(filterParams);
    if (selectedCategory !== "ALL") {
      items = items.filter((i) => i.category === selectedCategory);
    }
    return items;
  }, [filterParams, selectedCategory, storedIncidents]);

  const mapHotspots: MapHotspotItem[] = useMemo(() => {
    return getMapHotspots(filterParams);
  }, [filterParams, storedIncidents]);

  const mapClusters: MapClusterItem[] = useMemo(() => {
    return getMapClusters(filterParams);
  }, [filterParams, storedIncidents]);

  // Statistics summaries for surrounding cards
  const totalReportsOnMap = useMemo(
    () => mapIncidents.reduce((sum, item) => sum + item.complaintCount, 0),
    [mapIncidents]
  );
  const highPriorityCount = useMemo(
    () => mapIncidents.filter((i) => i.priority === "VERY_HIGH" || i.priority === "HIGH").length,
    [mapIncidents]
  );

  // Save manual API key from UI setup card
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKeyInput.trim()) return;
    setIsKeySaving(true);
    try {
      localStorage.setItem("CIVICRESOLVE_GMAPS_KEY", customKeyInput.trim());
      setApiKey(customKeyInput.trim());
      setMapLoadError(null);
    } finally {
      setIsKeySaving(false);
    }
  };

  // Helper to generate custom SVG Marker with Priority Color & Report Count Badge
  const createMarkerIcon = useCallback((priority: string, count: number) => {
    const isRed = priority === "VERY_HIGH" || priority === "HIGH";
    const isOrange = priority === "MEDIUM";
    const color = isRed ? "#DC2626" : isOrange ? "#EA580C" : "#16A34A";
    const countBadge = count > 1 ? String(count) : "";
    const badgeWidth = count >= 100 ? 26 : count >= 10 ? 22 : 18;

    const svg = `
      <svg width="46" height="56" viewBox="0 0 46 56" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.35"/>
          </filter>
        </defs>
        <path d="M23 2C12.5 2 4 10.5 4 21c0 15 19 32 19 32s19-17 19-32C42 10.5 33.5 2 23 2z" fill="${color}" filter="url(#shadow)"/>
        <circle cx="23" cy="21" r="11" fill="#FFFFFF"/>
        <circle cx="23" cy="21" r="6" fill="${color}"/>
        ${
          count > 1
            ? `
          <g transform="translate(23, -2)">
            <rect x="-${badgeWidth / 2}" y="0" width="${badgeWidth}" height="16" rx="8" fill="#0F172A" stroke="#FFFFFF" stroke-width="1.5"/>
            <text x="0" y="11.5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">${countBadge}</text>
          </g>
        `
            : ""
        }
      </svg>
    `;

    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(46, 56),
      anchor: new google.maps.Point(23, 54),
    };
  }, []);

  // Initialize Google Maps instance using official Loader
  useEffect(() => {
    if (!apiKey) return;
    if (!mapContainerRef.current) return;

    let isMounted = true;
    setOptions({
      key: apiKey,
      v: "weekly",
    });

    Promise.all([
      importLibrary("maps"),
      importLibrary("places"),
      importLibrary("visualization"),
      importLibrary("marker"),
    ])
      .then(() => {
        if (!isMounted || !mapContainerRef.current) return;

        // Default to Maharashtra / Kolhapur central coordinates
        const defaultCenter = { lat: 16.705, lng: 74.24 };

        const map = new google.maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 13,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: true, // We use rich custom government styled controls
          gestureHandling: "greedy",
          styles: [
            {
              featureType: "administrative.land_parcel",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "road",
              elementType: "labels.icon",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#C6DCFF" }],
            },
          ],
        });

        infoWindowRef.current = new google.maps.InfoWindow();
        mapInstanceRef.current = map;
        setMapLoaded(true);
        setMapLoadError(null);
      })
      .catch((err: unknown) => {
        console.error("Google Maps API Loader Error:", err);
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to initialize Google Maps. Check if the API key is active and has Maps JavaScript API enabled.";
          setMapLoadError(msg);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // Update Markers, InfoWindows, and Hotspots on Map when data/filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // 1. Clear old markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // 2. Clear old hotspot circles
    circlesRef.current.forEach((circle) => circle.setMap(null));
    circlesRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    // 3. Render Master Incident Markers (Exactly 1 marker per Master Incident with complaintCount)
    mapIncidents.forEach((item) => {
      const position = { lat: item.latitude, lng: item.longitude };
      bounds.extend(position);

      const marker = new google.maps.Marker({
        position,
        map,
        title: `${item.title} (${item.complaintCount} Reports)`,
        icon: createMarkerIcon(item.priority, item.complaintCount),
        animation: item.priority === "VERY_HIGH" ? google.maps.Animation.DROP : undefined,
      });

      marker.addListener("click", () => {
        setSelectedIncidentItem(item);

        if (infoWindowRef.current) {
          const priorityColor =
            item.priority === "VERY_HIGH" || item.priority === "HIGH"
              ? "#DC2626"
              : item.priority === "MEDIUM"
              ? "#EA580C"
              : "#16A34A";

          const statusColor =
            item.status === "RESOLVED"
              ? "#16A34A"
              : item.status === "IN_PROGRESS"
              ? "#0284C7"
              : item.status === "ESCALATED"
              ? "#DC2626"
              : "#EA580C";

          const contentString = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px; max-width: 310px; color: #0F172A;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 8px;">
                <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #0B4EA2;">${item.incidentId.toUpperCase()}</span>
                <span style="background: #0F172A; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9999px;">
                  ${item.complaintCount} ${item.complaintCount > 1 ? "Citizen Reports" : "Report"}
                </span>
              </div>
              <h4 style="font-size: 13px; font-weight: 700; line-height: 1.3; margin: 0 0 6px 0; color: #0F172A;">
                ${item.title}
              </h4>
              <p style="font-size: 11px; color: #64748B; margin: 0 0 8px 0; line-height: 1.3;">
                📍 ${item.location}
              </p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px 8px; border-radius: 6px; font-size: 10px; margin-bottom: 10px;">
                <div>
                  <span style="color: #64748B; display: block;">Department:</span>
                  <strong style="color: #0F172A;">${item.department}</strong>
                </div>
                <div>
                  <span style="color: #64748B; display: block;">Category:</span>
                  <strong style="color: #0F172A;">${item.category}</strong>
                </div>
                <div>
                  <span style="color: #64748B; display: block;">Priority:</span>
                  <strong style="color: ${priorityColor};">${item.priority}</strong>
                </div>
                <div>
                  <span style="color: #64748B; display: block;">Status:</span>
                  <strong style="color: ${statusColor};">${item.status}</strong>
                </div>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; margin-bottom: 10px; color: #64748B;">
                <span>⏱ SLA: <strong>${item.slaDeadline}</strong></span>
                <span style="color: ${item.isSlaBreached ? "#DC2626" : "#16A34A"}; font-weight: 700;">
                  ${item.isSlaBreached ? "⚠️ BREACHED" : "ON TRACK"}
                </span>
              </div>
              <button
                id="btn-inspect-${item.incidentId}"
                style="width: 100%; background: #0B4EA2; color: #FFFFFF; font-size: 11px; font-weight: 600; padding: 6px 12px; border-radius: 6px; border: none; cursor: pointer; text-align: center;"
              >
                Inspect Clustered Incident & Supporting Reports →
              </button>
            </div>
          `;

          infoWindowRef.current.setContent(contentString);
          infoWindowRef.current.open(map, marker);

          // Attach click handler to inspect button inside InfoWindow
          setTimeout(() => {
            const btn = document.getElementById(`btn-inspect-${item.incidentId}`);
            if (btn) {
              btn.onclick = () => {
                const fullIncident = activeIncidents.find((i) => i.id === item.incidentId);
                if (fullIncident && onSelectIncident) {
                  onSelectIncident(fullIncident);
                }
              };
            }
          }, 100);
        }
      });

      markersRef.current.push(marker);
    });

    // 4. Render Dynamic Hotspots Layer if active
    if (showHotspots) {
      mapHotspots.forEach((spot) => {
        const circle = new google.maps.Circle({
          strokeColor: spot.borderColor,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: spot.borderColor,
          fillOpacity: 0.18,
          map,
          center: spot.center,
          radius: spot.radiusMeters,
        });

        circle.addListener("click", () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(`
              <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 6px; max-width: 260px;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                  <span style="color: ${spot.borderColor}; font-size: 13px;">🔥</span>
                  <strong style="font-size: 12px; color: #0F172A;">${spot.name}</strong>
                </div>
                <p style="font-size: 11px; color: #64748B; margin: 0 0 6px 0;">
                  ${spot.densityLevel} Density Zone with <strong>${spot.complaintCount} total reports</strong> in immediate radius.
                </p>
                <span style="font-size: 10px; background: #F1F5F9; padding: 2px 6px; border-radius: 4px; color: #475569;">
                  Category: ${spot.dominantCategory}
                </span>
              </div>
            `);
            infoWindowRef.current.setPosition(spot.center);
            infoWindowRef.current.open(map);
          }
        });

        circlesRef.current.push(circle);
      });
    }

    // 5. Fit bounds if multiple markers exist
    if (mapIncidents.length > 0 && !bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
      // Avoid excessive zoom-in on single marker
      const listener = google.maps.event.addListenerOnce(map, "idle", () => {
        if (map.getZoom() && map.getZoom()! > 16) {
          map.setZoom(16);
        }
      });
    }
  }, [mapLoaded, mapIncidents, mapHotspots, showHotspots, createMarkerIcon, activeIncidents, onSelectIncident]);

  // Map Feature: Custom Zoom Controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 13) + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 13) - 1);
    }
  };

  // Map Feature: Fit to visible complaints
  const handleFitBounds = () => {
    if (!mapInstanceRef.current || mapIncidents.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    mapIncidents.forEach((item) => bounds.extend({ lat: item.latitude, lng: item.longitude }));
    mapInstanceRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
  };

  // Map Feature: Current GPS Location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapInstanceRef.current?.panTo(userPos);
        mapInstanceRef.current?.setZoom(15);

        if (userLocationMarkerRef.current) {
          userLocationMarkerRef.current.setPosition(userPos);
        } else {
          userLocationMarkerRef.current = new google.maps.Marker({
            position: userPos,
            map: mapInstanceRef.current,
            title: "Your Location",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#0B4EA2",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
            },
          });
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
      }
    );
  };

  // Map Feature: Search location input (centers map on match)
  const handleSearchLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocationQuery.trim()) return;

    // Check if query matches any known incident location
    const matched = mapIncidents.find(
      (i) =>
        i.location.toLowerCase().includes(searchLocationQuery.toLowerCase()) ||
        i.title.toLowerCase().includes(searchLocationQuery.toLowerCase()) ||
        i.incidentId.toLowerCase().includes(searchLocationQuery.toLowerCase())
    );

    if (matched && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: matched.latitude, lng: matched.longitude });
      mapInstanceRef.current.setZoom(16);
      setSelectedIncidentItem(matched);
    } else if (mapInstanceRef.current && window.google?.maps?.Geocoder) {
      // Use Google Geocoder if available
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: searchLocationQuery }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          mapInstanceRef.current?.setCenter(results[0].geometry.location);
          mapInstanceRef.current?.setZoom(14);
        }
      });
    }
  };

  // ==================== RENDER: SETUP CARD IF API KEY IS NOT CONFIGURED ====================
  if (!apiKey) {
    return (
      <div className={cn("bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden", className)}>
        {/* Setup Banner */}
        <div className="bg-[#0B4EA2] px-6 py-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-[#93C5FD]" />
              Official Government GIS Integration
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Google Maps Platform Configuration Required
            </h2>
            <p className="text-xs text-[#BFDBFE] max-w-xl">
              CivicResolve enforces real, live Google Maps rendering for state geospatial analytics.
              Follow the instructions below to activate your API key.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold border border-white/20">
              Database: {mapIncidents.length} Master Incidents Ready
            </span>
          </div>
        </div>

        {/* Setup Instructions & Key Input Box */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Quick Activation Form */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                <Key className="w-4 h-4 text-[#0B4EA2]" />
                <span>Instant API Key Activation</span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Enter your Google Maps API Key to test the live interactive map immediately.
                Your key will be securely saved in your browser session.
              </p>

              <form onSubmit={handleSaveApiKey} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mb-1">
                    Google Maps API Key:
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={customKeyInput}
                    onChange={(e) => setCustomKeyInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] bg-white text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0B4EA2] focus:ring-1 focus:ring-[#0B4EA2]"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full text-xs font-bold"
                  disabled={!customKeyInput.trim() || isKeySaving}
                >
                  {isKeySaving ? "Connecting Map..." : "Activate Live Google Map Now"}
                </Button>
              </form>

              <div className="pt-3 border-t border-[#E2E8F0] text-[11px] text-[#64748B] flex items-center justify-between">
                <span>Or add permanently to project:</span>
                <code className="bg-[#E2E8F0] px-1.5 py-0.5 rounded text-[10px] font-mono text-[#0F172A]">
                  .env.local
                </code>
              </div>
            </div>

            {/* Right: Step-by-Step Setup Guide */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
                Setup Checklist (3 Simple Steps):
              </h4>

              <div className="p-3 rounded-lg border border-[#E2E8F0] bg-white space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                  <span className="w-5 h-5 rounded-full bg-[#EAF2FF] text-[#0B4EA2] flex items-center justify-center text-[11px]">
                    1
                  </span>
                  <span>Google Cloud Console</span>
                </div>
                <p className="text-[#64748B] pl-7">
                  Go to{" "}
                  <a
                    href="https://console.cloud.google.com/google/maps-apis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0B4EA2] font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    console.cloud.google.com <ExternalLink className="w-3 h-3" />
                  </a>{" "}
                  and create or select your project.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#E2E8F0] bg-white space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                  <span className="w-5 h-5 rounded-full bg-[#EAF2FF] text-[#0B4EA2] flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <span>Enable Required APIs</span>
                </div>
                <p className="text-[#64748B] pl-7">
                  Enable <strong>Maps JavaScript API</strong>, <strong>Places API</strong>, and{" "}
                  <strong>Geocoding API</strong>.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#E2E8F0] bg-white space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                  <span className="w-5 h-5 rounded-full bg-[#EAF2FF] text-[#0B4EA2] flex items-center justify-center text-[11px]">
                    3
                  </span>
                  <span>Configure Environment File</span>
                </div>
                <p className="text-[#64748B] pl-7">
                  In <code className="text-[#0B4EA2]">frontend/.env.local</code>, set:
                  <br />
                  <code className="text-[10px] font-mono bg-[#F1F5F9] px-1 py-0.5 rounded block mt-1">
                    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* Database State Summary Ready to Map */}
          <div className="p-4 rounded-xl border border-[#BFDBFE] bg-[#EAF2FF]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0B4EA2] text-white flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-[#0F172A] block">
                  Database Coordinates & Clustered Hotspots Ready
                </strong>
                <span className="text-[#64748B]">
                  {mapIncidents.length} Master Incidents • {totalReportsOnMap} Citizen Reports Clustered
                  across Kolhapur, Pune, Mumbai, and Nashik.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-white text-[#0B4EA2] font-mono font-bold border border-[#BFDBFE]">
                PostGIS Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER: ERROR STATE ====================
  if (mapLoadError) {
    return (
      <div className={cn("bg-white rounded-2xl border border-[#FECACA] p-6 text-center space-y-3", className)}>
        <AlertTriangle className="w-10 h-10 text-[#DC2626] mx-auto" />
        <h3 className="font-bold text-base text-[#0F172A]">Google Maps Platform Error</h3>
        <p className="text-xs text-[#DC2626] max-w-md mx-auto">{mapLoadError}</p>
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.removeItem("CIVICRESOLVE_GMAPS_KEY");
              setApiKey("");
            }}
            className="text-xs"
          >
            Reconfigure API Key
          </Button>
        </div>
      </div>
    );
  }

  // ==================== RENDER: REAL GOOGLE MAP DASHBOARD ====================
  return (
    <div className={cn("bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden flex flex-col", className)}>
      {/* TOP COMMAND BAR: STATS, SEARCH & LAYER CONTROLS */}
      <div className="bg-[#0F172A] text-white p-3 sm:p-4 border-b border-[#334155] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Summary Metrics */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0B4EA2] flex items-center justify-center text-white">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xs font-bold block text-white leading-tight">
                State Geospatial Command
              </span>
              <span className="text-[10px] text-[#94A3B8] block">
                Google Maps JS Platform • Real-time Sync
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-[#334155] hidden sm:block" />

          {/* Key Counter Badges */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2.5 py-1 rounded bg-[#1E293B] border border-[#334155] text-[#93C5FD] font-semibold">
              📍 {mapIncidents.length} Master Cases
            </span>
            <span className="px-2.5 py-1 rounded bg-[#1E293B] border border-[#334155] text-[#34D399] font-semibold">
              👥 {totalReportsOnMap} Citizen Reports
            </span>
            {highPriorityCount > 0 && (
              <span className="px-2.5 py-1 rounded bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#FCA5A5] font-semibold">
                🔥 {highPriorityCount} High Priority
              </span>
            )}
          </div>
        </div>

        {/* Center/Right: Search Location & Layer Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Location Search Bar */}
          <form onSubmit={handleSearchLocation} className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ward, street, or incident..."
              value={searchLocationQuery}
              onChange={(e) => setSearchLocationQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-2 rounded-lg bg-[#1E293B] border border-[#334155] text-xs text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#38BDF8]"
            />
          </form>

          {/* Hotspot Layer Toggle */}
          <button
            type="button"
            onClick={() => setShowHotspots(!showHotspots)}
            className={cn(
              "h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors",
              showHotspots
                ? "bg-[#EF4444]/20 border-[#EF4444] text-[#FCA5A5]"
                : "bg-[#1E293B] border-[#334155] text-[#94A3B8] hover:text-white"
            )}
            title="Toggle Density Hotspots Layer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hotspots</span>
          </button>

          {/* Filter Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={cn(
              "h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors",
              showFilterDrawer
                ? "bg-[#0B4EA2] border-[#60A5FA] text-white"
                : "bg-[#1E293B] border-[#334155] text-[#94A3B8] hover:text-white"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          {/* Fit Bounds */}
          <button
            type="button"
            onClick={handleFitBounds}
            className="h-8 px-2.5 rounded-lg bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:text-white text-xs font-semibold flex items-center gap-1"
            title="Fit Map to Visible Grievances"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fit Bounds</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC FILTERS DRAWER (COLLAPSIBLE) */}
      {showFilterDrawer && (
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-3 text-xs space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div>
              <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                Division:
              </label>
              <select
                value={selectedDivisionId}
                onChange={(e) => setSelectedDivisionId(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A]"
              >
                <option value="ALL">All Divisions</option>
                {INITIAL_DIVISIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                Authority:
              </label>
              <select
                value={selectedAuthorityId}
                onChange={(e) => setSelectedAuthorityId(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A]"
              >
                <option value="ALL">All Authorities</option>
                {INITIAL_AUTHORITIES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                Department:
              </label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A]"
              >
                <option value="ALL">All Departments</option>
                {INITIAL_DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A]"
              >
                <option value="ALL">All Categories</option>
                <option value="Solid Waste">Solid Waste</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Drainage">Drainage</option>
                <option value="Roads & Footpaths">Roads & Footpaths</option>
                <option value="Streetlights">Streetlights</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                Priority:
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A]"
              >
                <option value="ALL">All Priorities</option>
                <option value="VERY_HIGH">VERY HIGH</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                Status:
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A]"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="ESCALATED">ESCALATED</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* MAP VIEWPORT + FLOATING CONTROLS & SIDE DRAWER */}
      <div className="relative flex-1 min-h-[500px] h-[580px] bg-[#E2E8F0] overflow-hidden">
        {/* Google Maps DOM Container */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Loading Spinner overlay while Google Maps initializes */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
            <RefreshCw className="w-7 h-7 text-[#0B4EA2] animate-spin" />
            <span className="text-xs font-bold text-[#0F172A]">Loading Google Maps Platform...</span>
          </div>
        )}

        {/* FLOATING MAP CONTROLS (RIGHT TOP) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 rounded-lg bg-white border border-[#CBD5E1] text-[#0F172A] shadow-md flex items-center justify-center hover:bg-[#F8FAFC] transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 rounded-lg bg-white border border-[#CBD5E1] text-[#0F172A] shadow-md flex items-center justify-center hover:bg-[#F8FAFC] transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Current GPS Location */}
          <button
            type="button"
            onClick={handleCurrentLocation}
            className="w-9 h-9 rounded-lg bg-white border border-[#CBD5E1] text-[#0B4EA2] shadow-md flex items-center justify-center hover:bg-[#F8FAFC] transition-colors"
            title="Current GPS Location"
            aria-label="Current GPS Location"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {/* MAP LEGEND (BOTTOM LEFT) */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xs border border-[#CBD5E1] rounded-xl p-3 shadow-md text-xs space-y-1.5 max-w-xs hidden sm:block">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
            Map Legend
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#DC2626] border border-white shadow-xs" />
            <span className="text-[#0F172A] font-medium text-[11px]">High / Very High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EA580C] border border-white shadow-xs" />
            <span className="text-[#0F172A] font-medium text-[11px]">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#16A34A] border border-white shadow-xs" />
            <span className="text-[#0F172A] font-medium text-[11px]">Low Priority</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-[#F1F5F9]">
            <span className="px-1.5 py-0.5 rounded bg-[#0F172A] text-white font-mono text-[9px] font-bold">
              25
            </span>
            <span className="text-[#475569] text-[11px]">Clustered Report Count</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-[#DC2626] bg-[#DC2626]/20" />
            <span className="text-[#475569] text-[11px]">Density Hotspot Zone</span>
          </div>
        </div>

        {/* SELECTED INCIDENT FLOATING DRAWER (BOTTOM RIGHT) */}
        {selectedIncidentItem && (
          <div className="absolute bottom-4 right-4 z-20 bg-white border border-[#CBD5E1] rounded-xl p-4 shadow-xl max-w-sm w-full animate-in slide-in-from-bottom-3 duration-150 space-y-3">
            <div className="flex items-start justify-between gap-2 border-b border-[#E2E8F0] pb-2">
              <div>
                <span className="font-mono text-xs font-bold text-[#0B4EA2]">
                  {selectedIncidentItem.incidentId.toUpperCase()}
                </span>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-[#0F172A] text-white font-bold text-[10px]">
                  {selectedIncidentItem.complaintCount} Reports Clustered
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncidentItem(null)}
                className="text-[#64748B] hover:text-[#0F172A] text-xs"
              >
                ✕
              </button>
            </div>

            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#0F172A] line-clamp-2">
                {selectedIncidentItem.title}
              </h4>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                📍 {selectedIncidentItem.location}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <PriorityBadge priority={selectedIncidentItem.priority} size="sm" />
              <StatusBadge status={selectedIncidentItem.status} size="sm" />
            </div>

            <Button
              variant="primary"
              size="sm"
              className="w-full text-xs font-bold"
              onClick={() => {
                const fullIncident = activeIncidents.find(
                  (i) => i.id === selectedIncidentItem.incidentId
                );
                if (fullIncident && onSelectIncident) {
                  onSelectIncident(fullIncident);
                }
              }}
            >
              Inspect Clustered Incident & Supporting Reports →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
