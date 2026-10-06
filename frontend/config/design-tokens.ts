/**
 * Complaint Intelligence Platform — Design Tokens
 * Source of truth for styling, colors, and layout across all portals.
 * Reference: complaint-system-frontend-README.md
 */

export const DESIGN_TOKENS = {
  colors: {
    primary: {
      DEFAULT: "#0B4EA2",
      dark: "#083B7A",
      light: "#EAF2FF",
    },
    ai: {
      DEFAULT: "#5B21B6",
      light: "#F3E8FF",
      border: "#DDD6FE",
    },
    warning: {
      DEFAULT: "#F59E0B",
      light: "#FFF7E6",
      border: "#FDE68A",
    },
    success: {
      DEFAULT: "#16A34A",
      light: "#ECFDF3",
      border: "#BBF7D0",
    },
    teal: {
      DEFAULT: "#0F766E",
      light: "#ECFEFF",
      border: "#99F6E4",
    },
    danger: {
      DEFAULT: "#DC2626",
      light: "#FEF2F2",
      border: "#FECACA",
    },
    neutral: {
      background: "#F8FAFC",
      surface: "#FFFFFF",
      surfaceSecondary: "#F1F5F9",
      textPrimary: "#0F172A",
      textSecondary: "#475569",
      textMuted: "#64748B",
      border: "#E2E8F0",
      borderDark: "#CBD5E1",
    },
  },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  radii: {
    control: "6px",
    button: "8px",
    input: "8px",
    card: "12px",
    container: "16px",
  },
} as const;

export default DESIGN_TOKENS;
