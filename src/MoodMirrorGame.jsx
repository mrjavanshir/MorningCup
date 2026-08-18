import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Link2, Music, RefreshCw } from "lucide-react";
import { TOKENS, MOODS } from "./messages.js";

function readParams() {
  const key = new URLSearchParams(window.location.search).get("m");
  return MOODS.some((mo) => mo.key === key) ? key : null;
}

export default function MoodMirrorGame() {
  const [sharedMood] = useState(readParams);
  const isViewer = sharedMood !== null;

  const [picked, setPicked] = useState(null);
  const [roll] = useState(() => Math.random());
  const [copied, setCopied] = useState(false);

  const mood = MOODS.find((m) => m.key === (isViewer ? sharedMood : picked)) || null;
  const response = mood ? mood.responses[Math.floor(roll * mood.responses.length)] : null;

  const copyLink = async () => {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}games/mood?m=${picked}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (isViewer) {
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-6">
          Ganira is feeling
        </p>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
          style={{
            background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
            border: `1px solid ${TOKENS.gold}55`,
            borderRadius: 16,
            padding: "20px",
          }}
          className="w-full"
        >
          <p style={{ color: TOKENS.gold, fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, textAlign: "center" }}>
            {mood.label}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {picked ? "Right then" : "How are you, honestly?"}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-6">
        {picked ? " " : "One tap. No explaining required."}
      </p>

      <div className="w-full flex flex-col gap-2.5 mb-5">
        {MOODS.map((m, i) => {
          const isPicked = picked === m.key;
          const dim = picked !== null && !isPicked;
          return (
            <motion.button
              key={m.key}
              onClick={() => !picked && setPicked(m.key)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: dim ? 0.25 : 1, y: 0, scale: isPicked ? 1.02 : 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 24, delay: picked ? 0 : i * 0.07 }}
              whileTap={picked ? undefined : { scale: 0.97 }}
              style={{
                width: "100%",
                background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                border: `1px solid ${isPicked ? TOKENS.gold : TOKENS.line}`,
                borderRadius: 14,
                padding: "14px 16px",
                color: TOKENS.cream,
                fontFamily: "'Fraunces', serif",
                fontSize: 15.5,
                textAlign: "left",
                cursor: picked ? "default" : "pointer",
              }}
            >
              {m.label}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 230, damping: 24, delay: 0.12 }}
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
                {response.note}
              </p>
            </div>

            <div
              style={{ border: `1px dashed ${TOKENS.line}`, borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}
              className="w-full flex items-start gap-2.5"
            >
              <Music size={14} color={TOKENS.gold} style={{ flexShrink: 0, marginTop: 3 }} />
              <div>
                <span style={{ color: TOKENS.gold, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                  Put on
                </span>
                <p style={{ color: TOKENS.muted, fontSize: 12.5, marginTop: 3 }}>{response.song}</p>
              </div>
            </div>

            <motion.button
              onClick={copyLink}
              whileTap={{ scale: 0.97 }}
              style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
              className="w-full h-12 rounded-full flex items-center justify-center gap-2 mb-3"
            >
              {copied ? <Check size={17} /> : <Link2 size={17} />} {copied ? "Link copied" : "Let him know"}
            </motion.button>

            <motion.button
              onClick={() => setPicked(null)}
              whileTap={{ scale: 0.97 }}
              style={{ color: TOKENS.muted, fontSize: 12.5 }}
              className="flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Actually, different mood
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
