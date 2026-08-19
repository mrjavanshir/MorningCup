import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Gift, RefreshCw } from "lucide-react";
import { TOKENS, SURPRISES, alpha } from "./messages.js";

const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  return { x: Math.cos(angle) * (70 + Math.random() * 30), y: Math.sin(angle) * (60 + Math.random() * 30) };
});

function shuffle(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SurpriseBoxGame() {
  const [deck, setDeck] = useState(() => shuffle(SURPRISES.length));
  const [drawn, setDrawn] = useState(0);
  const [phase, setPhase] = useState("closed"); // closed | shaking | open

  const surprise = SURPRISES[deck[drawn % deck.length]];

  const open = () => {
    if (phase !== "closed") return;
    setPhase("shaking");
    setTimeout(() => setPhase("open"), 620);
  };

  const again = () => {
    const next = drawn + 1;
    if (next % deck.length === 0) setDeck(shuffle(SURPRISES.length));
    setDrawn(next);
    setPhase("closed");
  };

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {phase === "open" ? surprise.kind : "There's something in the box"}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-6">
        {phase === "open" ? " " : "No idea what. That's the point."}
      </p>

      <div
        style={{
          position: "relative",
          height: 210,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <AnimatePresence>
          {phase !== "open" && (
            <motion.button
              key="box"
              onClick={open}
              aria-label="Open the box"
              animate={
                phase === "shaking"
                  ? { rotate: [0, -9, 9, -7, 7, -4, 4, 0], scale: [1, 1.05, 1.02, 1.06, 1] }
                  : { rotate: 0, scale: 1 }
              }
              exit={{ scale: 0.4, opacity: 0, rotate: 14 }}
              transition={phase === "shaking" ? { duration: 0.6 } : { type: "spring", stiffness: 300, damping: 20 }}
              whileTap={{ scale: 0.94 }}
              style={{
                width: 126,
                height: 126,
                borderRadius: 22,
                background: `linear-gradient(150deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                border: `1px solid ${alpha(TOKENS.gold, "66")}`,
                boxShadow: `0 14px 30px rgba(0,0,0,0.45), inset 0 0 24px ${alpha(TOKENS.gold, "18")}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Gift size={46} color={TOKENS.gold} />
            </motion.button>
          )}
        </AnimatePresence>

        {phase === "open" &&
          SPARKS.map((s, i) => (
            <motion.span
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: s.x, y: s.y, opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              style={{
                position: "absolute",
                width: 7,
                height: 7,
                borderRadius: 9999,
                background: TOKENS.glow,
                boxShadow: `0 0 10px 2px ${alpha(TOKENS.glow, "88")}`,
                pointerEvents: "none",
              }}
            />
          ))}

        <AnimatePresence>
          {phase === "open" && (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              style={{
                background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                border: `1px solid ${alpha(TOKENS.gold, "55")}`,
                borderRadius: 16,
                padding: "20px 22px",
                width: "100%",
              }}
            >
              <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 17, lineHeight: 1.45, textAlign: "center" }}>
                {surprise.text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === "open" ? (
        <motion.button
          onClick={again}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          whileTap={{ scale: 0.97 }}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2"
        >
          <RefreshCw size={15} /> Another one
        </motion.button>
      ) : (
        <p style={{ color: TOKENS.muted, fontSize: 11.5 }}>Tap it</p>
      )}
    </div>
  );
}
