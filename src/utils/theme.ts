export type Theme = "light" | "dark";

let currentTheme: Theme = "light";

export function setTheme(theme: Theme) {
  currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function getTheme(): Theme {
  return currentTheme;
}

export function toggleTheme(): Theme {
  const newTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(newTheme);
  return newTheme;
}
