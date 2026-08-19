import React, { useEffect, useRef, useState } from "react";
import { Sparkle, ArrowUpFromLine, Check, Eraser, Gift, Link2, Moon, NotebookPen, Scale, Scroll, Stamp, Sun, Sunrise, Sunset } from "lucide-react";
import { TOKENS } from "./messages.js";
import SunGame from "./SunGame.jsx";
import DaybreakGame from "./DaybreakGame.jsx";
import AgreementGame from "./AgreementGame.jsx";
import ThisOrThatGame from "./ThisOrThatGame.jsx";
import SurpriseBoxGame from "./SurpriseBoxGame.jsx";
import VerseJarGame from "./VerseJarGame.jsx";
import CloseDayGame from "./CloseDayGame.jsx";
import ThreeThingsGame from "./ThreeThingsGame.jsx";
import HighlightsGame from "./HighlightsGame.jsx";
import NamesGame from "./NamesGame.jsx";
import SharedSettings from "./SharedSettings.jsx";
import { cachedConfig, clearOwner, fetchSharedConfig, readOwner, unlockOwner } from "./owner.js";

// `shared` controls only what the hub LISTS. Every game stays reachable at its
// own /games/<id> URL whatever this says, so links already sent keep working.
const GAMES = [
  { id: "sun", icon: Sunrise, title: "Sunrise", desc: "Tap to raise it.", shared: true },
  { id: "daybreak", icon: ArrowUpFromLine, title: "Daybreak", desc: "Drag to bring up the sun.", shared: true },
  { id: "agreement", icon: Stamp, title: "Agreement", desc: "Stamp it to make it official.", shared: true },
  { id: "this-or-that", icon: Scale, title: "This or That", desc: "Pick a side, compare picks.", shared: true },
  { id: "surprise", icon: Gift, title: "Surprise Box", desc: "No idea what's inside.", shared: true },
  { id: "jar", icon: Scroll, title: "Verses Jar", desc: "Read me when…", shared: true },
  { id: "names", icon: Sparkle, title: "The 99 Names", desc: "One at a time, or all of them.", shared: true },
  { id: "close-day", icon: Eraser, title: "Close the Day", desc: "Dump it out, watch it go.", night: true, shared: true },
  { id: "three-things", icon: NotebookPen, title: "Three Good Things", desc: "Log what went well today.", night: true, shared: true },
  { id: "highlights", icon: Sunset, title: "Highlights", desc: "Both share the best bit.", night: true, shared: true },
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
  const [isOwner, setIsOwner] = useState(readOwner);
  const [showSettings, setShowSettings] = useState(false);
  // Start from whatever this device last saw so the list does not flicker or
  // sit empty offline, then refresh from the Worker.
  const [config, setConfig] = useState(cachedConfig);

  useEffect(() => {
    let cancelled = false;
    fetchSharedConfig().then((c) => {
      if (!cancelled && c) setConfig(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isShared = (g) => (config && g.id in config ? config[g.id] : g.shared !== false);
  const visibleGames = isOwner ? GAMES : GAMES.filter(isShared);

  const lockAgain = () => {
    clearOwner();
    setIsOwner(false);
  };

  const holdRef = useRef(null);
  const [showUnlock, setShowUnlock] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [keyBad, setKeyBad] = useState(false);

  const startHold = () => {
    if (isOwner) return;
    holdRef.current = setTimeout(() => setShowUnlock(true), 1500);
  };
  const cancelHold = () => {
    clearTimeout(holdRef.current);
    holdRef.current = null;
  };
  useEffect(() => () => clearTimeout(holdRef.current), []);

  const tryUnlock = () => {
    if (unlockOwner(keyDraft)) {
      setIsOwner(true);
      setShowUnlock(false);
      setKeyDraft("");
      setKeyBad(false);
    } else {
      setKeyBad(true);
    }
  };

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
        @media (prefers-reduced-motion: reduce) {
          .cf-fade, .sn-rays, .cf-nudge, .db-star, .fs-stamp-in { animation: none; }
        }
      `}</style>

      <div className="w-full max-w-sm flex flex-col items-center">
        {isNight ? <Moon size={18} color={TOKENS.gold} className="mb-2" /> : <Sun size={18} color={TOKENS.gold} className="mb-2" />}
        {/* Press and hold the title for ~1.5s to unlock without a URL — the
            only way in from an installed app, which has no address bar. */}
        <h1
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            color: TOKENS.cream,
            fontFamily: "'Fraunces', serif",
            fontWeight: 600,
            fontSize: 26,
            textAlign: "center",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
          }}
          className="mb-1"
        >
          {isNight ? "Good Night, Ganira" : "Hello, Ganira"}
        </h1>
        <p style={{ color: TOKENS.muted, fontSize: 13.5, textAlign: "center" }} className="mb-8">
          {isNight ? "something small before you sleep." : "a little something, whenever you need it."}
        </p>

        {showUnlock && (
          <div
            className="w-full flex flex-col items-center"
            style={{
              background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
              border: `1px solid ${TOKENS.line}`,
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 22,
            }}
          >
            <input
              value={keyDraft}
              onChange={(e) => {
                setKeyDraft(e.target.value);
                setKeyBad(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
              placeholder="Key"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              style={{
                width: "100%",
                background: TOKENS.bgDeep,
                border: `1px solid ${keyBad ? "#C4184F" : TOKENS.line}`,
                borderRadius: 8,
                color: TOKENS.cream,
                fontFamily: "'Manrope', sans-serif",
                fontSize: 13,
                padding: "8px 10px",
                marginBottom: 10,
              }}
            />
            <div className="flex items-center gap-4">
              <button onClick={tryUnlock} style={{ color: TOKENS.gold, fontSize: 12, fontWeight: 700 }}>
                Unlock
              </button>
              <button
                onClick={() => {
                  setShowUnlock(false);
                  setKeyDraft("");
                  setKeyBad(false);
                }}
                style={{ color: TOKENS.muted, fontSize: 12 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
        ) : showSettings && isOwner ? (
          <SharedSettings games={GAMES} onBack={() => setShowSettings(false)} />
        ) : route.view === "hub" ? (
          <>
            {isOwner && (
              <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-4">
                Each game has its own link — whoever opens it only sees that one game.
              </p>
            )}
            <div className="w-full flex flex-col gap-3">
              {visibleGames.map((g, i) => {
                const Icon = g.icon;
                const startsGroup = i === 0 || visibleGames[i - 1].night !== g.night;
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
                    {isOwner && (
                    <button
                      onClick={() => copyLink(g.id)}
                      aria-label={`Copy the ${g.title} link`}
                      style={{ background: TOKENS.bgDeep, color: TOKENS.cream, border: `1px solid ${TOKENS.line}` }}
                      className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0"
                    >
                      {copiedId === g.id ? <Check size={15} color={TOKENS.gold} /> : <Link2 size={15} />}
                    </button>
                    )}
                  </div>
                  </React.Fragment>
                );
              })}
            </div>
            {isOwner && (
              <div className="flex items-center gap-2 mt-5">
                <span style={{ color: TOKENS.gold, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2 }}>
                  YOUR VIEW · {GAMES.length} games
                </span>
                <button
                  onClick={() => setShowSettings(true)}
                  style={{ color: TOKENS.gold, fontSize: 10.5, fontWeight: 700 }}
                >
                  what she sees
                </button>
                <button
                  onClick={lockAgain}
                  style={{ color: TOKENS.muted, fontSize: 10.5, opacity: 0.75 }}
                >
                  preview hers
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {route.id === "sun" && <SunGame />}
            {route.id === "daybreak" && <DaybreakGame />}
            {route.id === "agreement" && <AgreementGame />}
            {route.id === "this-or-that" && <ThisOrThatGame />}
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
