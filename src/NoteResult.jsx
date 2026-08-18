import React from "react";
import { RefreshCw } from "lucide-react";
import { TOKENS } from "./messages.js";

export default function NoteResult({ message, onAgain, againLabel }) {
  return (
    <div className="cf-fade w-full">
      <div
        style={{
          background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
          border: `1px solid ${TOKENS.gold}55`,
          borderRadius: 18,
          padding: "20px 20px",
          marginBottom: 16,
        }}
      >
        <span style={{ color: TOKENS.gold, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
          {message.cat}
        </span>
        <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 18, lineHeight: 1.45, marginTop: 8 }}>
          {message.text}
        </p>
      </div>
      <button
        onClick={onAgain}
        style={{ background: TOKENS.gold, color: TOKENS.bgDeep }}
        className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-sm font-bold cursor-pointer"
      >
        <RefreshCw size={15} /> {againLabel}
      </button>
    </div>
  );
}
