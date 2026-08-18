import React, { useState } from "react";
import { Check, RefreshCw, Users, Zap } from "lucide-react";
import { TOKENS, ENERGIZER_PROMPTS } from "./messages.js";

const DURATION = 20;
const RADIUS = 60;
const CIRC = 2 * Math.PI * RADIUS;

function pickPrompt(exclude) {
  if (ENERGIZER_PROMPTS.length <= 1) return ENERGIZER_PROMPTS[0];
  let next = ENERGIZER_PROMPTS[Math.floor(Math.random() * ENERGIZER_PROMPTS.length)];
  while (next === exclude) next = ENERGIZER_PROMPTS[Math.floor(Math.random() * ENERGIZER_PROMPTS.length)];
  return next;
}

export default function EnergizerGame() {
  const [prompt, setPrompt] = useState(() => pickPrompt(null));
  const [phase, setPhase] = useState("ready"); // ready | active | done

  const start = () => {
    setPhase("active");
    setTimeout(() => setPhase("done"), DURATION * 1000);
  };

  const doAnother = () => {
    setPrompt((prev) => pickPrompt(prev));
    setPhase("ready");
  };

  if (phase === "done") {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="en-pop flex flex-col items-center w-full">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} color={TOKENS.gold} />
            <span style={{ color: TOKENS.gold, fontSize: 12, fontWeight: 700 }}>Energized</span>
          </div>
          <div
            style={{
              background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
              border: `1px solid ${TOKENS.gold}55`,
              borderRadius: 16,
              padding: "18px 20px",
              marginBottom: 16,
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Check size={20} color={TOKENS.gold} />
            <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 15, lineHeight: 1.4 }}>
              Nice. That counts as a break — back to it, or do one more.
            </p>
          </div>
        </div>
        <button
          onClick={doAnother}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2"
        >
          <RefreshCw size={15} /> One more
        </button>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-6">
          Go — {DURATION} seconds
        </p>
        <div style={{ position: "relative", width: 140, height: 140, marginBottom: 24 }}>
          <svg width={140} height={140} viewBox="0 0 140 140">
            <circle cx={70} cy={70} r={RADIUS} stroke={TOKENS.line} strokeWidth={8} fill="none" />
            <circle
              cx={70}
              cy={70}
              r={RADIUS}
              stroke={TOKENS.gold}
              strokeWidth={8}
              fill="none"
              strokeDasharray={CIRC}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              className="en-ring-drain"
            />
          </svg>
          <Zap
            size={36}
            color={TOKENS.gold}
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          />
        </div>
        {prompt.duo && (
          <div className="flex items-center gap-1.5 mb-3">
            <Users size={12} color={TOKENS.gold} />
            <span style={{ color: TOKENS.gold, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Together</span>
          </div>
        )}
        <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 18, lineHeight: 1.45, textAlign: "center" }}>
          {prompt.text}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        Quick energizer break
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-6">
        {DURATION} seconds, no equipment required
      </p>

      <button
        onClick={start}
        aria-label="Start"
        style={{
          width: 140, height: 140, borderRadius: "9999px",
          background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
          border: `1px solid ${TOKENS.line}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Zap size={40} color={TOKENS.gold} />
      </button>
      <p style={{ color: TOKENS.muted, fontSize: 12 }}>Tap to start</p>
    </div>
  );
}
