import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages serves the site from /MorningCup/, so assets need that prefix.
// Dev server is unaffected.
export default defineConfig({
  base: "/MorningCup/",
  plugins: [react(), tailwindcss()],
});
