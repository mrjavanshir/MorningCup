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

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
