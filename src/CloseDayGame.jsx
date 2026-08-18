import React, { useState } from "react";
import { motion } from "motion/react";
import { Moon, RefreshCw } from "lucide-react";
import { TOKENS, CLOSE_DAY_MESSAGES } from "./messages.js";

function pickIndex(exclude) {
  if (CLOSE_DAY_MESSAGES.length <= 1) return 0;
  let next = Math.floor(Math.random() * CLOSE_DAY_MESSAGES.length);
  while (next === exclude) next = Math.floor(Math.random() * CLOSE_DAY_MESSAGES.length);
  return next;
}

export default function CloseDayGame() {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("write"); // write | dissolving | gone
  const [messageIndex, setMessageIndex] = useState(() => pickIndex(null));

  const words = text.trim().split(/\s+/).filter(Boolean);
  const message = CLOSE_DAY_MESSAGES[messageIndex];

  const closeDay = () => {
    if (!words.length) return;
    setPhase("dissolving");
    const total = 900 + words.length * 45;
    setTimeout(() => setPhase("gone"), Math.min(total, 2600));
  };

  const again = () => {
    setText("");
    setMessageIndex((i) => pickIndex(i));
    setPhase("write");
  };

  if (phase === "gone") {
    return (
      <div className="w-full flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="w-full flex flex-col items-center"
        >
          <div className="flex items-center gap-2 mb-3">
            <Moon size={16} color={TOKENS.gold} />
            <span style={{ color: TOKENS.gold, fontSize: 12, fontWeight: 700 }}>{message.cat}</span>
          </div>
          <div
            style={{
              background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
              border: `1px solid ${TOKENS.gold}55`,
              borderRadius: 16,
              padding: "18px 20px",
              marginBottom: 16,
            }}
            className="w-full"
          >
            <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 17, lineHeight: 1.45 }}>
              {message.text}
            </p>
          </div>
        </motion.div>
        <motion.button
          onClick={again}
          whileTap={{ scale: 0.97 }}
          style={{ color: TOKENS.muted, fontSize: 12.5 }}
          className="flex items-center gap-1.5"
        >
          <RefreshCw size={13} /> Something else is bothering me
        </motion.button>
      </div>
    );
  }

  const dissolving = phase === "dissolving";

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {dissolving ? "Letting it go..." : "What's still in your head?"}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-6">
        {dissolving ? " " : "Nothing here is saved or sent anywhere."}
      </p>

      <div
        style={{
          width: "100%",
          minHeight: 168,
          background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
          border: `1px solid ${TOKENS.line}`,
          borderRadius: 16,
          padding: "14px 16px",
          marginBottom: 18,
          display: "flex",
        }}
      >
        {dissolving ? (
          <p style={{ display: "flex", flexWrap: "wrap", gap: "0 6px", alignContent: "flex-start" }}>
            {words.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                animate={{ opacity: 0, y: -34, filter: "blur(7px)" }}
                transition={{ duration: 1.1, delay: i * 0.045, ease: "easeOut" }}
                style={{ color: TOKENS.cream, fontFamily: "'Manrope', sans-serif", fontSize: 13.5, lineHeight: 1.6 }}
              >
                {w}
              </motion.span>
            ))}
          </p>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Everything still going round in your head. Dump it here."
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              resize: "none",
              color: TOKENS.cream,
              fontFamily: "'Manrope', sans-serif",
              fontSize: 13.5,
              lineHeight: 1.6,
              outline: "none",
            }}
          />
        )}
      </div>

      {!dissolving && (
        <motion.button
          onClick={closeDay}
          disabled={!words.length}
          whileTap={words.length ? { scale: 0.97 } : undefined}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700, opacity: words.length ? 1 : 0.5 }}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2"
        >
          <Moon size={16} /> Close the day
        </motion.button>
      )}
    </div>
  );
}
