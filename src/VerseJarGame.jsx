import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { TOKENS, VERSE_JAR } from "./messages.js";

const PAPER = "#F4ECDC";
const CORK = "#C29A63";

// The rolled papers you can see through the glass.
function buildRolls() {
  const rolls = [];
  const perRow = 9;
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < perRow; i++) {
      const emotion = VERSE_JAR[Math.floor(Math.random() * VERSE_JAR.length)];
      rolls.push({
        id: `${row}-${i}`,
        color: emotion.color,
        left: 4 + i * 10.6 + (Math.random() * 2 - 1),
        top: 6 + row * 23,
        height: 20 + Math.random() * 4,
        tilt: Math.random() * 8 - 4,
      });
    }
  }
  return rolls;
}

export default function VerseJarGame() {
  const rolls = useMemo(buildRolls, []);
  const [picked, setPicked] = useState(null);
  const [seen, setSeen] = useState({});

  const emotion = picked ? VERSE_JAR.find((e) => e.key === picked) : null;

  // Cycle through an emotion's verses instead of repeating one at random.
  const verse = emotion ? emotion.verses[(seen[emotion.key] ?? 0) % emotion.verses.length] : null;

  const pick = (key) => {
    if (picked) return;
    setPicked(key);
  };

  const putBack = () => {
    setSeen((prev) => ({ ...prev, [picked]: (prev[picked] ?? 0) + 1 }));
    setPicked(null);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {picked ? emotion.label : "Read me when…"}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-5">
        {picked ? " " : "Pick how you're feeling, take one out"}
      </p>

      <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center", marginBottom: 18 }}>
        {/* jar */}
        <div style={{ width: 210, position: "relative" }}>
          {/* cork */}
          <div
            style={{
              width: 128,
              height: 30,
              margin: "0 auto",
              borderRadius: "7px 7px 4px 4px",
              background: `linear-gradient(180deg, ${CORK}, #A87F4C)`,
              border: "1px solid rgba(0,0,0,0.25)",
            }}
          />
          {/* glass */}
          <div
            style={{
              position: "relative",
              height: 224,
              borderRadius: "10px 10px 26px 26px",
              background: "linear-gradient(120deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.09))",
              border: "1px solid rgba(243,231,218,0.28)",
              borderTop: "none",
              overflow: "hidden",
              boxShadow: "0 16px 34px rgba(0,0,0,0.45), inset 0 0 30px rgba(255,255,255,0.05)",
            }}
          >
            {rolls.map((r) => (
              <span
                key={r.id}
                style={{
                  position: "absolute",
                  left: `${r.left}%`,
                  top: r.top,
                  width: 9,
                  height: r.height,
                  borderRadius: 3,
                  background: `linear-gradient(180deg, ${r.color}, ${r.color}bb)`,
                  transform: `rotate(${r.tilt}deg)`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
                }}
              />
            ))}

            {/* paper label with the legend, tappable */}
            <div
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                bottom: 16,
                background: PAPER,
                borderRadius: 4,
                padding: "9px 10px 10px",
                boxShadow: "0 3px 10px rgba(0,0,0,0.35)",
              }}
            >
              <p
                style={{
                  color: "#2A1620",
                  fontFamily: "'Fraunces', serif",
                  fontSize: 12.5,
                  textAlign: "center",
                  letterSpacing: 0.6,
                  marginBottom: 7,
                }}
              >
                READ ME WHEN…
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 6px" }}>
                {VERSE_JAR.map((e) => (
                  <button
                    key={e.key}
                    onClick={() => pick(e.key)}
                    aria-label={`Take a ${e.label} verse`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "none",
                      border: "none",
                      padding: "1px 0",
                      cursor: picked ? "default" : "pointer",
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: 1.5, background: e.color, flexShrink: 0 }} />
                    <span
                      style={{
                        color: "#5A4632",
                        fontSize: 9.5,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {e.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* the scroll that comes out and unrolls */}
        <AnimatePresence>
          {picked && (
            <motion.div
              key={picked}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 26 }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <motion.div
                initial={{ scaleY: 0.03 }}
                animate={{ scaleY: 1 }}
                transition={{ type: "spring", stiffness: 130, damping: 20, delay: 0.1 }}
                style={{
                  width: "100%",
                  transformOrigin: "top center",
                  background: `linear-gradient(180deg, ${PAPER}, #E9DFC9)`,
                  borderRadius: 8,
                  borderTop: `4px solid ${emotion.color}`,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.5)",
                  padding: "20px 20px 18px",
                }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.38 }}
                >
                  <p
                    style={{
                      color: "#2A1620",
                      fontFamily: "'Fraunces', serif",
                      fontSize: 16,
                      lineHeight: 1.55,
                      textAlign: "center",
                    }}
                  >
                    {verse.text}
                  </p>
                  <p
                    style={{
                      color: emotion.color,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      textAlign: "center",
                      marginTop: 12,
                    }}
                  >
                    {verse.ref}
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {picked ? (
        <motion.button
          onClick={putBack}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.97 }}
          style={{ color: TOKENS.muted, fontSize: 12.5 }}
          className="flex items-center gap-1.5"
        >
          <X size={13} /> Put it back
        </motion.button>
      ) : (
        <p style={{ color: TOKENS.muted, fontSize: 11.5 }}>Tap a colour on the label</p>
      )}
    </div>
  );
}
