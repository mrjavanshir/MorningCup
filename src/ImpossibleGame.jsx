import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import { TOKENS, IMPOSSIBLE_PAYOFFS } from "./messages.js";

const MAX_ESCAPES = 7;
const COOLDOWN = 260;

// One label per escape, ending in surrender. It reacts to her, which is the joke.
const LABELS = [
  "Press to fix your day",
  "no",
  "nope",
  "not today",
  "you're persistent",
  "this is my job",
  "we're both tired",
  "...fine.",
];

function fleeTo(escapeCount) {
  // Later escapes stay closer to the middle — the button is running out of steam.
  const energy = 1 - escapeCount / MAX_ESCAPES;
  const rx = 24 + 96 * energy;
  const ry = 18 + 62 * energy;
  const angle = Math.random() * Math.PI * 2;
  return { x: Math.cos(angle) * rx, y: Math.sin(angle) * ry };
}

function pickPayoff(exclude) {
  if (IMPOSSIBLE_PAYOFFS.length <= 1) return 0;
  let next = Math.floor(Math.random() * IMPOSSIBLE_PAYOFFS.length);
  while (next === exclude) next = Math.floor(Math.random() * IMPOSSIBLE_PAYOFFS.length);
  return next;
}

export default function ImpossibleGame() {
  const [escapes, setEscapes] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [caught, setCaught] = useState(false);
  const [pressedAgain, setPressedAgain] = useState(false);
  const [payoffIndex, setPayoffIndex] = useState(() => pickPayoff(null));
  const lastFlee = useRef(0);

  const exhausted = escapes >= MAX_ESCAPES;

  const flee = () => {
    if (exhausted || caught) return;
    const now = Date.now();
    if (now - lastFlee.current < COOLDOWN) return;
    lastFlee.current = now;
    const next = escapes + 1;
    setEscapes(next);
    setPos(fleeTo(next));
  };

  const press = () => {
    if (!exhausted) return;
    if (caught) {
      setPressedAgain(true);
      return;
    }
    setCaught(true);
  };

  const reset = () => {
    setEscapes(0);
    setPos({ x: 0, y: 0 });
    setCaught(false);
    setPressedAgain(false);
    setPayoffIndex((i) => pickPayoff(i));
  };

  const label = caught ? "press me again" : LABELS[Math.min(escapes, LABELS.length - 1)];

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {caught ? "You caught it" : exhausted ? "It's given up. Press it." : "Press the button"}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-4">
        {caught ? " " : exhausted ? " " : "It would rather you didn't"}
      </p>

      <div
        style={{
          position: "relative",
          width: "100%",
          height: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
          touchAction: "manipulation",
        }}
      >
        <motion.div
          animate={{
            x: pos.x,
            y: pos.y,
            rotate: exhausted && !caught ? [-2.5, 2.5, -2.5] : 0,
            scale: caught ? 0.96 : 1,
          }}
          transition={{
            x: { type: "spring", stiffness: 520 - escapes * 45, damping: 12 + escapes * 2 },
            y: { type: "spring", stiffness: 520 - escapes * 45, damping: 12 + escapes * 2 },
            rotate: exhausted && !caught ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 },
            scale: { type: "spring", stiffness: 300, damping: 20 },
          }}
          onPointerEnter={flee}
          onPointerMove={flee}
          onPointerDown={flee}
          style={{ position: "absolute", padding: 26 }}
        >
          <motion.button
            onClick={press}
            aria-label="The impossible button"
            whileTap={exhausted ? { scale: 0.94 } : undefined}
            style={{
              background: caught ? `${TOKENS.gold}cc` : TOKENS.gold,
              color: TOKENS.bgDeep,
              fontWeight: 700,
              fontSize: 14,
              padding: "0 26px",
              height: 52,
              borderRadius: 9999,
              border: "none",
              whiteSpace: "nowrap",
              boxShadow: exhausted ? "0 4px 10px rgba(0,0,0,0.3)" : "0 10px 26px rgba(216,168,87,0.35)",
              cursor: "pointer",
              opacity: caught ? 0.75 : 1,
            }}
          >
            {label}
          </motion.button>
        </motion.div>
      </div>

      {caught ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="w-full flex flex-col items-center"
        >
          <div
            style={{
              background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
              border: `1px solid ${TOKENS.gold}55`,
              borderRadius: 16,
              padding: "18px 20px",
              marginBottom: 12,
            }}
            className="w-full"
          >
            <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 17, lineHeight: 1.45 }}>
              {IMPOSSIBLE_PAYOFFS[payoffIndex]}
            </p>
          </div>

          <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-4">
            Escape attempts: {MAX_ESCAPES} · Success rate: 0%
            {pressedAgain && " · It isn't even trying anymore"}
          </p>

          <motion.button
            onClick={reset}
            whileTap={{ scale: 0.97 }}
            style={{ color: TOKENS.muted, fontSize: 12.5 }}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> Let it get its confidence back
          </motion.button>
        </motion.div>
      ) : (
        <div className="flex gap-1.5">
          {Array.from({ length: MAX_ESCAPES }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                background: i < escapes ? TOKENS.gold : TOKENS.line,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
