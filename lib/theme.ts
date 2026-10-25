export type Theme = "light" | "dark" | "system";

export const THEME_COOKIE = "theme";

export function parseTheme(value: string | undefined): Theme {
  return value === "light" || value === "dark" ? value : "system";
}

export function themeClass(theme: Theme) {
  return theme === "system" ? "" : theme;
}
