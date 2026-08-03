/** Shared colours for stack screens, headers, and page backgrounds. */
export const appTheme = {
  primary: "#4db5ff",
  primaryDark: "#24A8FF",
  background: "#E1F5FF",
  surface: "#FFFFFF",
  text: "#1E293B",
  textMuted: "#64748B",
  white: "#FFFFFF",
  /** Light-blue → white gradient used on authenticated screens (matches home). */
  gradient: {
    colors: ["#E1F5FF", "#FFFFFF"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  header: {
    primary: {
      background: "#4db5ff",
      text: "#FFFFFF",
      icon: "#FFFFFF",
    },
    surface: {
      background: "#E1F5FF",
      text: "#1E293B",
      icon: "#1E293B",
    },
  },
} as const;
