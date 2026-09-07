export type ThemeType = "dark" | "light" | "system";

export function getInitialTheme(): ThemeType {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem("genz_theme") as ThemeType | null;
    if (saved === "dark" || saved === "light" || saved === "system") {
      return saved;
    }
  } catch {}
  return "dark";
}

export function applyTheme(theme: ThemeType) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("genz_theme", theme);
  } catch {}

  let effectiveTheme: "dark" | "light" = "dark";
  if (theme === "system") {
    effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } else {
    effectiveTheme = theme;
  }

  document.documentElement.setAttribute("data-theme", effectiveTheme);
  if (effectiveTheme === "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  } else {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");
  }
}
