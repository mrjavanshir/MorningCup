import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Grid3x3, Shuffle, X } from "lucide-react";
import { TOKENS, alpha } from "./messages.js";
import { NAMES } from "./names.js";

const SEEN_KEY = "names-seen";

function loadSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeen(seen) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* private mode */
  }
}

// Same Name for anyone opening it on a given day, like the jar's verse.
function nameOfTheDay() {
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return hash % NAMES.length;
}

function readStartIndex() {
  const n = new URLSearchParams(window.location.search).get("n");
  const num = Number(n);
  return n && Number.isInteger(num) && num >= 1 && num <= NAMES.length ? num - 1 : nameOfTheDay();
}

export default function NamesGame() {
  const [index, setIndex] = useState(readStartIndex);
  const [dir, setDir] = useState(0);
  const [seen, setSeen] = useState(loadSeen);
  const [showIndex, setShowIndex] = useState(false);

  const name = NAMES[index];

  useEffect(() => {
    setSeen((prev) => {
      if (prev.has(name.n)) return prev;
      const next = new Set(prev).add(name.n);
      saveSeen(next);
      return next;
    });
  }, [name.n]);

  const go = (delta) => {
    setDir(delta);
    setIndex((i) => (i + delta + NAMES.length) % NAMES.length);
  };

  const jump = (i) => {
    setDir(i > index ? 1 : -1);
    setIndex(i);
    setShowIndex(false);
  };

  const random = () => {
    let next = index;
    while (next === index) next = Math.floor(Math.random() * NAMES.length);
    setDir(1);
    setIndex(next);
  };

  if (showIndex) {
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
          All ninety-nine
        </p>
        <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-5">
          {seen.size} of {NAMES.length} opened
        </p>
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(58px, 1fr))", gap: 7, width: "100%" }}
          className="mb-5"
        >
          {NAMES.map((nm, i) => (
            <motion.button
              key={nm.n}
              onClick={() => jump(i)}
              whileTap={{ scale: 0.94 }}
              aria-label={`${nm.n}. ${nm.tr}`}
              style={{
                aspectRatio: "1",
                borderRadius: 10,
                border: `1px solid ${seen.has(nm.n) ? `${alpha(TOKENS.gold, "66")}` : TOKENS.line}`,
                background: seen.has(nm.n)
                  ? `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`
                  : "transparent",
                color: seen.has(nm.n) ? TOKENS.gold : TOKENS.muted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {nm.n}
            </motion.button>
          ))}
        </div>
        <button
          onClick={() => setShowIndex(false)}
          style={{ color: TOKENS.muted, fontSize: 12.5 }}
          className="flex items-center gap-1.5"
        >
          <X size={13} /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        The ninety-nine Names
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-6">
        Swipe, or tap the grid for all of them
      </p>

      <div style={{ position: "relative", width: "100%", height: 300, marginBottom: 18 }}>
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={name.n}
            custom={dir}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70 || info.velocity.x < -450) go(1);
              else if (info.offset.x > 70 || info.velocity.x > 450) go(-1);
            }}
            initial={(d) => ({ opacity: 0, x: d > 0 ? 90 : -90, scale: 0.96 })}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={(d) => ({ opacity: 0, x: d > 0 ? -90 : 90, scale: 0.96 })}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
              border: `1px solid ${alpha(TOKENS.gold, "44")}`,
              borderRadius: 20,
              boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "26px 22px",
              cursor: "grab",
              touchAction: "pan-y",
            }}
          >
            <span
              style={{
                color: TOKENS.muted,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 1.6,
                marginBottom: 18,
              }}
            >
              {String(name.n).padStart(2, "0")} / {NAMES.length}
            </span>

            <p
              dir="rtl"
              lang="ar"
              style={{
                color: TOKENS.gold,
                fontFamily: "'Amiri', serif",
                fontSize: 54,
                lineHeight: 1.5,
                textAlign: "center",
                textShadow: `0 0 26px ${alpha(TOKENS.glow, "33")}`,
                marginBottom: 14,
              }}
            >
              {name.ar}
            </p>

            <div style={{ width: 44, height: 1, background: `${alpha(TOKENS.gold, "55")}`, marginBottom: 14 }} />

            <p
              style={{
                color: TOKENS.cream,
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {name.tr}
            </p>
            <p
              style={{
                color: TOKENS.cream,
                fontFamily: "'Fraunces', serif",
                fontSize: 17,
                lineHeight: 1.4,
                textAlign: "center",
              }}
            >
              {name.meaning}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => go(-1)}
          whileTap={{ scale: 0.94 }}
          aria-label="Previous name"
          style={{
            width: 42,
            height: 42,
            borderRadius: 9999,
            border: `1px solid ${TOKENS.line}`,
            color: TOKENS.cream,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={17} />
        </motion.button>
        <motion.button
          onClick={() => setShowIndex(true)}
          whileTap={{ scale: 0.94 }}
          aria-label="Show all names"
          style={{
            height: 42,
            padding: "0 16px",
            borderRadius: 9999,
            border: `1px solid ${TOKENS.line}`,
            color: TOKENS.muted,
            fontSize: 11.5,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <Grid3x3 size={14} /> {seen.size}/{NAMES.length}
        </motion.button>
        <motion.button
          onClick={random}
          whileTap={{ scale: 0.94 }}
          aria-label="Random name"
          style={{
            width: 42,
            height: 42,
            borderRadius: 9999,
            border: `1px solid ${TOKENS.line}`,
            color: TOKENS.gold,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Shuffle size={16} />
        </motion.button>
        <motion.button
          onClick={() => go(1)}
          whileTap={{ scale: 0.94 }}
          aria-label="Next name"
          style={{
            width: 42,
            height: 42,
            borderRadius: 9999,
            border: `1px solid ${TOKENS.line}`,
            color: TOKENS.cream,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronRight size={17} />
        </motion.button>
      </div>
    </div>
  );
}
