import React, { useState } from "react";
import { Sparkle, ArrowUpFromLine, BatteryCharging, Bird, Check, Eraser, Gem, Gift, Link2, ListChecks, Moon, MousePointerClick, NotebookPen, Scale, Scroll, Smile, Sparkles, Stamp, Sun, Sunrise, Sunset, VenetianMask, Zap } from "lucide-react";
import { TOKENS } from "./messages.js";
import SunGame from "./SunGame.jsx";
import DaybreakGame from "./DaybreakGame.jsx";
import AgreementGame from "./AgreementGame.jsx";
import ThisOrThatGame from "./ThisOrThatGame.jsx";
import RechargeGame from "./RechargeGame.jsx";
import PlansGame from "./PlansGame.jsx";
import OrigamiGame from "./OrigamiGame.jsx";
import EnergizerGame from "./EnergizerGame.jsx";
import ScratchGame from "./ScratchGame.jsx";
import TruthsGame from "./TruthsGame.jsx";
import ImpossibleGame from "./ImpossibleGame.jsx";
import LittleMomentsGame from "./LittleMomentsGame.jsx";
import MoodMirrorGame from "./MoodMirrorGame.jsx";
import SurpriseBoxGame from "./SurpriseBoxGame.jsx";
import VerseJarGame from "./VerseJarGame.jsx";
import CloseDayGame from "./CloseDayGame.jsx";
import ThreeThingsGame from "./ThreeThingsGame.jsx";
import HighlightsGame from "./HighlightsGame.jsx";
import NamesGame from "./NamesGame.jsx";

const GAMES = [
  { id: "sun", icon: Sunrise, title: "Sunrise", desc: "Tap to raise it." },
  { id: "daybreak", icon: ArrowUpFromLine, title: "Daybreak", desc: "Drag to bring up the sun." },
  { id: "agreement", icon: Stamp, title: "Agreement", desc: "Stamp it to make it official." },
  { id: "this-or-that", icon: Scale, title: "This or That", desc: "Pick a side, compare picks." },
  { id: "recharge", icon: BatteryCharging, title: "Recharge", desc: "Score your day, get a boost." },
  { id: "plans", icon: ListChecks, title: "Future Plans", desc: "List ideas, see what overlaps." },
  { id: "origami", icon: Bird, title: "Origami", desc: "Fold a flower or a swan." },
  { id: "energizer", icon: Zap, title: "Energizer", desc: "20 seconds, no equipment." },
  { id: "scratch", icon: Sparkles, title: "Scratch Card", desc: "Scratch the gold, claim a prize." },
  { id: "truths", icon: VenetianMask, title: "Two Truths & a Lie", desc: "Spot the one that isn't true." },
  { id: "impossible", icon: MousePointerClick, title: "The Impossible Button", desc: "It does not want to be pressed." },
  { id: "little-moments", icon: Gem, title: "Little Moments", desc: "Take a seed, get a reason." },
  { id: "mood", icon: Smile, title: "Mood Mirror", desc: "One tap, no explaining." },
  { id: "surprise", icon: Gift, title: "Surprise Box", desc: "No idea what's inside." },
  { id: "jar", icon: Scroll, title: "Verses Jar", desc: "Read me when…" },
  { id: "names", icon: Sparkle, title: "The 99 Names", desc: "One at a time, or all of them." },
  { id: "close-day", icon: Eraser, title: "Close the Day", desc: "Dump it out, watch it go.", night: true },
  { id: "three-things", icon: NotebookPen, title: "Three Good Things", desc: "Log what went well today.", night: true },
  { id: "highlights", icon: Sunset, title: "Highlights", desc: "Both share the best bit.", night: true },
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

// Opt-in via ?after=22 — the page refuses to open before that hour.
// Hours before 4am still count as "night", so a 1am visit is not locked.
function nightLockHour() {
  const raw = new URLSearchParams(window.location.search).get("after");
  if (!raw || !/^\d{1,2}$/.test(raw)) return null;
  const h = Number(raw);
  if (h > 23) return null;
  const now = new Date().getHours();
  return now >= 4 && now < h ? h : null;
}

export default function App() {
  const [route, setRoute] = useState(parseRoute);
  const [lockHour] = useState(nightLockHour);
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

  const activeGame = route.view === "game" ? GAMES.find((g) => g.id === route.id) : null;
  const isNight = !!activeGame?.night;
  const locked = route.view === "game" && lockHour !== null;

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
        @keyframes og-pop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .og-crane-pop { animation: og-pop 0.4s cubic-bezier(.3,1.4,.5,1) forwards; }
        @keyframes og-unfold { 0% { transform: scaleY(0.05) rotateX(70deg); opacity: 0; } 100% { transform: scaleY(1) rotateX(0deg); opacity: 1; } }
        .og-unfold-in { animation: og-unfold 0.5s ease-out forwards; transform-origin: top center; }
        @keyframes en-drain { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 377; } }
        .en-ring-drain { animation: en-drain 20s linear forwards; }
        @keyframes en-pop { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .en-pop { animation: en-pop 0.3s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .cf-fade, .sn-rays, .cf-nudge, .db-star, .fs-stamp-in, .rg-charge-fill, .rg-charge-pulse, .og-crane-pop, .og-unfold-in, .en-ring-drain, .en-pop { animation: none; }
        }
      `}</style>

      <div className="w-full max-w-sm flex flex-col items-center">
        {isNight ? <Moon size={18} color={TOKENS.gold} className="mb-2" /> : <Sun size={18} color={TOKENS.gold} className="mb-2" />}
        <h1
          style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26, textAlign: "center" }}
          className="mb-1"
        >
          {isNight ? "Good Night, Ganira" : "Hello, Ganira"}
        </h1>
        <p style={{ color: TOKENS.muted, fontSize: 13.5, textAlign: "center" }} className="mb-8">
          {isNight ? "something small before you sleep." : "a little something, whenever you need it."}
        </p>

        {locked ? (
          <div className="flex flex-col items-center" style={{ paddingTop: 12 }}>
            <Moon size={34} color={TOKENS.gold} style={{ opacity: 0.7, marginBottom: 14 }} />
            <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 17, textAlign: "center" }} className="mb-2">
              Not yet.
            </p>
            <p style={{ color: TOKENS.muted, fontSize: 12.5, textAlign: "center" }}>
              This one opens after {String(lockHour).padStart(2, "0")}:00. Come back tonight.
            </p>
          </div>
        ) : route.view === "hub" ? (
          <>
            <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-4">
              Each game has its own link — whoever opens it only sees that one game.
            </p>
            <div className="w-full flex flex-col gap-3">
              {GAMES.map((g, i) => {
                const Icon = g.icon;
                const startsGroup = i === 0 || GAMES[i - 1].night !== g.night;
                return (
                  <React.Fragment key={g.id}>
                    {startsGroup && (
                      <span
                        style={{
                          color: TOKENS.muted,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 1.6,
                          textTransform: "uppercase",
                          marginTop: i === 0 ? 0 : 10,
                          marginBottom: -4,
                        }}
                      >
                        {g.night ? "For the night" : "For the morning"}
                      </span>
                    )}
                  <div
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
                  </React.Fragment>
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
            {route.id === "origami" && <OrigamiGame />}
            {route.id === "energizer" && <EnergizerGame />}
            {route.id === "scratch" && <ScratchGame />}
            {route.id === "truths" && <TruthsGame />}
            {route.id === "impossible" && <ImpossibleGame />}
            {route.id === "little-moments" && <LittleMomentsGame />}
            {route.id === "mood" && <MoodMirrorGame />}
            {route.id === "surprise" && <SurpriseBoxGame />}
            {route.id === "jar" && <VerseJarGame />}
            {route.id === "names" && <NamesGame />}
            {route.id === "close-day" && <CloseDayGame />}
            {route.id === "three-things" && <ThreeThingsGame />}
            {route.id === "highlights" && <HighlightsGame />}
          </>
        )}
      </div>
    </div>
  );
}
