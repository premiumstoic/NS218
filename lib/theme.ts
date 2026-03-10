import { ThemeToken } from "@/lib/types";
import { PROFILE_THEME_MAP } from "@/lib/constants";

type AppThemePalette = {
  bg: string;
  bgSpot: string;
  bgAlt: string;
  surface: string;
  surfaceSoft: string;
  ink: string;
  inkMuted: string;
  accent: string;
  accentStrong: string;
  line: string;
  badgeBg: string;
  latestFrom: string;
  latestTo: string;
};

const APP_THEME_MAP: Record<ThemeToken, AppThemePalette> = {
  sage: {
    bg: "#f4f8f2",
    bgSpot: "#e3efe0",
    bgAlt: "#f8fbf7",
    surface: "#ffffff",
    surfaceSoft: "#edf3e8",
    ink: "#1e2a22",
    inkMuted: "#4b6256",
    accent: "#0f8a5f",
    accentStrong: "#076646",
    line: "#cbd8ce",
    badgeBg: "#def8ec",
    latestFrom: "#f4fbf7",
    latestTo: "#eef8f2"
  },
  ocean: {
    bg: "#f1f7fb",
    bgSpot: "#dfedf6",
    bgAlt: "#f7fbfe",
    surface: "#ffffff",
    surfaceSoft: "#eaf3fa",
    ink: "#1b2833",
    inkMuted: "#4a6477",
    accent: "#0b79b5",
    accentStrong: "#095b88",
    line: "#c5d7e6",
    badgeBg: "#e1f1fb",
    latestFrom: "#f0f9ff",
    latestTo: "#e7f4fd"
  },
  amber: {
    bg: "#fbf7ef",
    bgSpot: "#f5ead5",
    bgAlt: "#fdfaf4",
    surface: "#ffffff",
    surfaceSoft: "#f9efdd",
    ink: "#2b2417",
    inkMuted: "#6a5940",
    accent: "#b77711",
    accentStrong: "#8d5b0d",
    line: "#e3d0ae",
    badgeBg: "#fbeecf",
    latestFrom: "#fffaf0",
    latestTo: "#fbeedb"
  },
  rose: {
    bg: "#fcf4f7",
    bgSpot: "#f6e1e9",
    bgAlt: "#fef8fa",
    surface: "#ffffff",
    surfaceSoft: "#f9eaf0",
    ink: "#2c1e24",
    inkMuted: "#725164",
    accent: "#ba4d79",
    accentStrong: "#8c365a",
    line: "#e5c7d4",
    badgeBg: "#fae4ed",
    latestFrom: "#fff5f9",
    latestTo: "#f9e8ef"
  },
  slate: {
    bg: "#f2f4f7",
    bgSpot: "#e3e8ef",
    bgAlt: "#f8f9fc",
    surface: "#ffffff",
    surfaceSoft: "#ebeff4",
    ink: "#1f2530",
    inkMuted: "#566478",
    accent: "#3f5f92",
    accentStrong: "#2d466e",
    line: "#c8d1de",
    badgeBg: "#e4eaf4",
    latestFrom: "#f5f8fd",
    latestTo: "#e9eef7"
  }
};

export function getThemeCardStyle(themeToken?: string | null): { background: string; borderColor: string } {
  const fallback = PROFILE_THEME_MAP.sage;
  if (!themeToken) {
    return { background: fallback.cardBackground, borderColor: fallback.cardBorder };
  }

  const theme = PROFILE_THEME_MAP[themeToken as ThemeToken] ?? fallback;
  return { background: theme.cardBackground, borderColor: theme.cardBorder };
}

export function getAppThemeVariables(themeToken?: string | null): Record<string, string> {
  const palette = themeToken ? APP_THEME_MAP[themeToken as ThemeToken] ?? APP_THEME_MAP.sage : APP_THEME_MAP.sage;

  return {
    ["--bg" as const]: palette.bg,
    ["--bg-spot" as const]: palette.bgSpot,
    ["--bg-alt" as const]: palette.bgAlt,
    ["--surface" as const]: palette.surface,
    ["--surface-soft" as const]: palette.surfaceSoft,
    ["--ink" as const]: palette.ink,
    ["--ink-muted" as const]: palette.inkMuted,
    ["--accent" as const]: palette.accent,
    ["--accent-strong" as const]: palette.accentStrong,
    ["--line" as const]: palette.line,
    ["--badge-bg" as const]: palette.badgeBg,
    ["--latest-from" as const]: palette.latestFrom,
    ["--latest-to" as const]: palette.latestTo
  };
}
