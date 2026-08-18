import React from "react";
import { createRoot } from "react-dom/client";
import MorningCup from "./MorningCup.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MorningCup />
  </React.StrictMode>
);
