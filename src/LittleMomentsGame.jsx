import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { TOKENS, LITTLE_MOMENTS } from "./messages.js";

const RUBY = "#B3123C";
const RUBY_LIGHT = "#E23A63";

// Seeds packed into a rough pomegranate cluster.
function buildSeeds(count) {
  const seeds = [];
  const cols = 5;
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const rowOffset = row % 2 === 0 ? 0 : 9;
    seeds.push({
      id: i,
      left: 12 + col * 17.5 + rowOffset + (Math.random() * 3 - 1.5),
      top: 16 + row * 17 + (Math.random() * 3 - 1.5),
      delay: Math.random() * 2,
      size: 25 + Math.random() * 7,
    });
  }
  return seeds;
}

function shuffle(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LittleMomentsGame() {
  const seeds = useMemo(() => buildSeeds(Math.min(LITTLE_MOMENTS.length, 20)), []);
  const [deck, setDeck] = useState(() => shuffle(LITTLE_MOMENTS.length));
  const [drawn, setDrawn] = useState(0);
  const [openSeed, setOpenSeed] = useState(null);

  const messageIndex = deck[drawn % deck.length];

  const takeSeed = (seedId) => {
    if (openSeed !== null) return;
    setOpenSeed(seedId);
  };

  const close = () => {
    setOpenSeed(null);
    const next = drawn + 1;
    // Reshuffle once every message has been seen, so nothing repeats in a run.
    if (next % deck.length === 0) setDeck(shuffle(LITTLE_MOMENTS.length));
    setDrawn(next);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {openSeed !== null ? "One of them" : "Take a seed"}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-5">
        {openSeed !== null ? " " : "Things worth mentioning, one at a time"}
      </p>

      <div
        style={{
          position: "relative",
          width: "100%",
          height: 300,
          borderRadius: "26px 26px 60px 60px",
          overflow: "hidden",
          background: "linear-gradient(180deg, #2A0E18, #3B121F 60%, #250B14)",
          border: `1px solid ${RUBY}55`,
          boxShadow: "0 16px 34px rgba(0,0,0,0.45)",
          marginBottom: 16,
        }}
      >
        {seeds.map((s) => (
          <motion.button
            key={s.id}
            layoutId={`seed-${s.id}`}
            onClick={() => takeSeed(s.id)}
            aria-label="Take a seed"
            initial={false}
            animate={{ opacity: openSeed === null ? 1 : openSeed === s.id ? 1 : 0.18 }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            style={{
              position: "absolute",
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size * 1.15,
              padding: 0,
              border: "none",
              borderRadius: "48% 48% 52% 52%",
              background: `radial-gradient(circle at 34% 28%, ${RUBY_LIGHT}, ${RUBY})`,
              boxShadow: `0 3px 10px rgba(0,0,0,0.45), inset 0 0 8px ${RUBY_LIGHT}66`,
              cursor: openSeed === null ? "pointer" : "default",
            }}
          />
        ))}

        <AnimatePresence>
          {openSeed !== null && (
            <motion.div
              key="note"
              layoutId={`seed-${openSeed}`}
              transition={{ type: "spring", stiffness: 210, damping: 26 }}
              style={{
                position: "absolute",
                inset: 14,
                borderRadius: 18,
                background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                border: `1px solid ${TOKENS.gold}66`,
                boxShadow: "0 14px 30px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "22px 22px",
              }}
            >
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                style={{
                  color: TOKENS.cream,
                  fontFamily: "'Fraunces', serif",
                  fontSize: 16.5,
                  lineHeight: 1.5,
                  textAlign: "center",
                }}
              >
                {LITTLE_MOMENTS[messageIndex]}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {openSeed !== null ? (
        <motion.button
          onClick={close}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          style={{ color: TOKENS.muted, fontSize: 12.5 }}
          className="flex items-center gap-1.5"
        >
          <X size={13} /> Put it back
        </motion.button>
      ) : (
        <p style={{ color: TOKENS.muted, fontSize: 11.5 }}>Tap any one of them</p>
      )}
    </div>
  );
}
