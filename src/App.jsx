import React, { useState } from "react";
import { Check, Coffee, Link2, Sun, Sunrise } from "lucide-react";
import { TOKENS } from "./messages.js";
import CupGame from "./CupGame.jsx";
import SunGame from "./SunGame.jsx";

const GAMES = [
  { id: "cup", icon: Coffee, title: "The Cup", desc: "Tap to fill it up." },
  { id: "sun", icon: Sunrise, title: "Sunrise", desc: "Tap to raise it." },
];

function readForcedMode() {
  const path = window.location.pathname.slice(import.meta.env.BASE_URL.length).replace(/\/+$/, "");
  return GAMES.some((g) => g.id === path) ? path : null;
}

function gameLink(id) {
  return `${window.location.origin}${import.meta.env.BASE_URL}${id}`;
}

export default function App() {
  const [forced] = useState(readForcedMode);
  const [mode, setMode] = useState(forced);
  const [copiedId, setCopiedId] = useState(null);

  const copyLink = async (id) => {
    try {
      await navigator.clipboard.writeText(gameLink(id));
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div
      style={{ background: TOKENS.bgDeep, minHeight: "100vh", fontFamily: "'Manrope', sans-serif" }}
      className="w-full flex flex-col items-center px-4 py-8"
    >
      <style>{`
        @keyframes cf-steam {
          0% { transform: translateY(0) scaleX(1); opacity: 0; }
          25% { opacity: 0.55; }
          100% { transform: translateY(-46px) scaleX(1.6); opacity: 0; }
        }
        .cf-steam { animation-name: cf-steam; animation-timing-function: ease-out; animation-iteration-count: infinite; }
        @keyframes cf-fade { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        .cf-fade { animation: cf-fade 0.4s ease-out; }
        .cf-cup:active { transform: scale(0.97); }
        .sn-sun-btn:active { transform: scale(0.97); }
        @keyframes sn-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.9; } }
        .sn-rays { animation: sn-pulse 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .cf-steam, .cf-fade, .sn-rays { animation: none; }
        }
      `}</style>

      <div className="w-full max-w-sm flex flex-col items-center">
        <Sun size={18} color={TOKENS.gold} className="mb-2" />
        <h1
          style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26, textAlign: "center" }}
          className="mb-1"
        >
          Good Morning, Ganira
        </h1>
        <p style={{ color: TOKENS.muted, fontSize: 13.5, textAlign: "center" }} className="mb-8">
          a little morning surprise, just for you.
        </p>

        {mode === null ? (
          <>
            <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-4">
              Each game has its own link — whoever opens it only sees that one game.
            </p>
            <div className="w-full flex flex-col gap-3">
              {GAMES.map((g) => {
                const Icon = g.icon;
                return (
                  <div
                    key={g.id}
                    style={{
                      background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                      border: `1px solid ${TOKENS.line}`,
                      borderRadius: 16,
                      padding: "8px 8px 8px 16px",
                    }}
                    className="w-full flex items-center gap-3"
                  >
                    <button
                      onClick={() => setMode(g.id)}
                      style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: "8px 0" }}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: `${TOKENS.gold}22`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={19} color={TOKENS.gold} />
                      </div>
                      <div className="min-w-0">
                        <div style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600 }}>{g.title}</div>
                        <div style={{ color: TOKENS.muted, fontSize: 12.5, marginTop: 2 }}>{g.desc}</div>
                      </div>
                    </button>
                    <button
                      onClick={() => copyLink(g.id)}
                      aria-label={`Copy the ${g.title} link`}
                      style={{ background: TOKENS.bgDeep, color: TOKENS.cream, border: `1px solid ${TOKENS.line}` }}
                      className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0"
                    >
                      {copiedId === g.id ? <Check size={15} color={TOKENS.gold} /> : <Link2 size={15} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {mode === "cup" && <CupGame />}
            {mode === "sun" && <SunGame />}
          </>
        )}
      </div>
    </div>
  );
}
