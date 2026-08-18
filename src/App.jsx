import React, { useState } from "react";
import { ArrowUpFromLine, BatteryCharging, Check, Link2, ListChecks, Scale, Stamp, Sun, Sunrise } from "lucide-react";
import { TOKENS } from "./messages.js";
import SunGame from "./SunGame.jsx";
import DaybreakGame from "./DaybreakGame.jsx";
import AgreementGame from "./AgreementGame.jsx";
import ThisOrThatGame from "./ThisOrThatGame.jsx";
import RechargeGame from "./RechargeGame.jsx";
import PlansGame from "./PlansGame.jsx";

const GAMES = [
  { id: "sun", icon: Sunrise, title: "Sunrise", desc: "Tap to raise it." },
  { id: "daybreak", icon: ArrowUpFromLine, title: "Daybreak", desc: "Drag to bring up the sun." },
  { id: "agreement", icon: Stamp, title: "Agreement", desc: "Stamp it to make it official." },
  { id: "this-or-that", icon: Scale, title: "This or That", desc: "Pick a side, compare picks." },
  { id: "recharge", icon: BatteryCharging, title: "Recharge", desc: "Score your day, get a boost." },
  { id: "plans", icon: ListChecks, title: "Future Plans", desc: "List ideas, see what overlaps." },
];

function parseRoute() {
  const path = window.location.pathname.slice(import.meta.env.BASE_URL.length).replace(/\/+$/, "");
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 1 && segments[0] === "sun") return { view: "game", id: "sun" };
  if (segments[0] !== "games") return { view: "blank" };
  if (segments.length === 1) return { view: "hub" };
  if (segments.length === 2 && GAMES.some((g) => g.id === segments[1])) return { view: "game", id: segments[1] };
  return { view: "blank" };
}

function gameLink(id) {
  return `${window.location.origin}${import.meta.env.BASE_URL}games/${id}`;
}

export default function App() {
  const [route, setRoute] = useState(parseRoute);
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

  if (route.view === "blank") {
    return <div style={{ background: TOKENS.bgDeep, minHeight: "100vh" }} />;
  }

  return (
    <div
      style={{ background: TOKENS.bgDeep, minHeight: "100vh", fontFamily: "'Manrope', sans-serif" }}
      className="w-full flex flex-col items-center px-4 py-8"
    >
      <style>{`
        @keyframes cf-fade { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        .cf-fade { animation: cf-fade 0.4s ease-out; }
        .sn-sun-btn:active { transform: scale(0.97); }
        @keyframes sn-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.9; } }
        .sn-rays { animation: sn-pulse 2.4s ease-in-out infinite; }
        @keyframes cf-nudge {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(216,168,87,0); }
          50% { transform: scale(1.035); box-shadow: 0 0 16px 2px rgba(216,168,87,0.55); }
        }
        .cf-nudge { animation: cf-nudge 1.8s ease-in-out 1.2s infinite; }
        @keyframes db-twinkle { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.3; } }
        .db-star { animation: db-twinkle 2s ease-in-out infinite; }
        @keyframes fs-stamp { 0% { transform: scale(2.4) rotate(-18deg); opacity: 0; } 60% { transform: scale(0.92) rotate(-14deg); opacity: 1; } 100% { transform: scale(1) rotate(-14deg); opacity: 1; } }
        .fs-stamp-in { animation: fs-stamp 0.5s cubic-bezier(.3,1.4,.5,1) forwards; }
        @keyframes rg-fill { from { width: 0%; } to { width: 100%; } }
        .rg-charge-fill { animation: rg-fill 1.2s ease-out forwards; }
        @keyframes rg-pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.15); } }
        .rg-charge-pulse { animation: rg-pulse 0.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .cf-fade, .sn-rays, .cf-nudge, .db-star, .fs-stamp-in, .rg-charge-fill, .rg-charge-pulse { animation: none; }
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

        {route.view === "hub" ? (
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
                      onClick={() => setRoute({ view: "game", id: g.id })}
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
            {route.id === "sun" && <SunGame />}
            {route.id === "daybreak" && <DaybreakGame />}
            {route.id === "agreement" && <AgreementGame />}
            {route.id === "this-or-that" && <ThisOrThatGame />}
            {route.id === "recharge" && <RechargeGame />}
            {route.id === "plans" && <PlansGame />}
          </>
        )}
      </div>
    </div>
  );
}
