/**
 * Dark or light, remembered per device.
 *
 * Defaults to dark rather than the system setting: the app was designed dark,
 * and someone whose phone is in light mode should not have it look different
 * from the day before just because a theme option appeared.
 */

const THEME_KEY = "ui-theme";

export function currentTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");

  // Keep the browser chrome in step, or a light page keeps a dark status bar.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#f7f1e6" : "#170D11");

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode */
  }
}
