import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// After a deploy the new service worker installs and takes over, but the page
// already running keeps the old JS until it reloads — so a change can look like
// it never shipped. Reload once when a new worker takes control.
// The guard matters: without it, a worker claiming an uncontrolled page on the
// very first visit would reload immediately, and any loop would be endless.
if ("serviceWorker" in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading || !navigator.serviceWorker.controller) return;
    reloading = true;
    window.location.reload();
  });
}

// The gift links (the birthday card and the roses) are one-off pages for one
// person, not a way into the app: they must never offer to install it. Their
// prerendered HTML already carries no manifest (scripts/prerender.mjs), but
// the page can still arrive as the main app's HTML — from a service worker
// installed before that change, a fallback, or the dev server — so the same
// signals are removed here too, the browser's own install prompt is
// swallowed, and no service worker is registered from these pages.
const giftPath = new RegExp(`^${import.meta.env.BASE_URL}(apps|games)/(birthday|roses)/?$`);
const gift = window.location.pathname.match(giftPath)?.[2];
const isGift = !!gift;

// Same names and icons as scripts/prerender.mjs gives these pages.
const GIFT_HEAD = {
  birthday: { title: "Happy Birthday", emoji: "🎂" },
  roses: { title: "Sənin üçün", emoji: "🌹" },
};

if (isGift) {
  document.title = GIFT_HEAD[gift].title;
  const icon = document.querySelector('link[rel="icon"]');
  if (icon) {
    icon.removeAttribute("type");
    icon.href = `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="82" font-size="80">${GIFT_HEAD[gift].emoji}</text></svg>`,
    )}`;
  }
  document
    .querySelectorAll(
      'link[rel="manifest"], link[rel="apple-touch-icon"], meta[name="apple-mobile-web-app-capable"], meta[name="apple-mobile-web-app-title"], meta[name="apple-mobile-web-app-status-bar-style"], meta[name="mobile-web-app-capable"]',
    )
    .forEach((el) => el.remove());
  window.addEventListener("beforeinstallprompt", (e) => e.preventDefault());
} else if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {});
  });
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
