import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, Link2, Moon } from "lucide-react";
import { TOKENS, THREE_THINGS_CLOSERS, alpha } from "./messages.js";

const SLOTS = 3;

function encodeThings(list) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(list))));
}

function decodeThings(raw) {
  try {
    const val = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (!Array.isArray(val) || val.length !== SLOTS) return null;
    if (val.some((s) => typeof s !== "string" || !s.trim())) return null;
    return val;
  } catch {
    return null;
  }
}

function readParams() {
  const raw = new URLSearchParams(window.location.search).get("t");
  return raw ? decodeThings(raw) : null;
}

export default function ThreeThingsGame() {
  const [viewThings] = useState(readParams);
  const isViewer = viewThings !== null;

  const [things, setThings] = useState(["", "", ""]);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [closer] = useState(() => THREE_THINGS_CLOSERS[Math.floor(Math.random() * THREE_THINGS_CLOSERS.length)]);

  const ready = things.every((t) => t.trim());

  const setThing = (i, value) => setThings((prev) => prev.map((t, idx) => (idx === i ? value : t)));

  const copyResultLink = async () => {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}games/three-things?t=${encodeThings(
      things.map((t) => t.trim())
    )}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const list = isViewer ? viewThings : things.map((t) => t.trim());

  if (isViewer || submitted) {
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-6">
          {isViewer ? "Three good things from Ganira's day" : "Three good things, logged"}
        </p>

        <div className="w-full flex flex-col gap-2.5 mb-5">
          {list.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 250, damping: 24, delay: i * 0.12 }}
              style={{
                background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                border: `1px solid ${alpha(TOKENS.gold, "44")}`,
                borderRadius: 14,
                padding: "13px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <span style={{ color: TOKENS.gold, fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                {i + 1}
              </span>
              <span style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 14.5, lineHeight: 1.4 }}>
                {t}
              </span>
            </motion.div>
          ))}
        </div>

        {!isViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="w-full flex flex-col items-center"
          >
            <p style={{ color: TOKENS.muted, fontSize: 12.5, textAlign: "center" }} className="mb-5">
              {closer}
            </p>
            <motion.button
              onClick={copyResultLink}
              whileTap={{ scale: 0.97 }}
              style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
              className="w-full h-12 rounded-full flex items-center justify-center gap-2"
            >
              {copied ? <Check size={17} /> : <Link2 size={17} />} {copied ? "Link copied" : "Send them to him"}
            </motion.button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        Three things that went well today
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-6">
        They're allowed to be very small
      </p>

      <div className="w-full flex flex-col gap-3 mb-6">
        {things.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24, delay: i * 0.08 }}
            style={{
              background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
              border: `1px solid ${t.trim() ? TOKENS.gold + "44" : TOKENS.line}`,
              borderRadius: 14,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ color: TOKENS.gold, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
            <input
              value={t}
              onChange={(e) => setThing(i, e.target.value)}
              placeholder="Something good, however small"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: TOKENS.cream,
                fontFamily: "'Manrope', sans-serif",
                fontSize: 13,
              }}
            />
          </motion.div>
        ))}
      </div>

      <motion.button
        onClick={() => setSubmitted(true)}
        disabled={!ready}
        whileTap={ready ? { scale: 0.97 } : undefined}
        style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700, opacity: ready ? 1 : 0.5 }}
        className="w-full h-12 rounded-full flex items-center justify-center gap-2"
      >
        <Moon size={16} /> That's the day
      </motion.button>
    </div>
  );
}
