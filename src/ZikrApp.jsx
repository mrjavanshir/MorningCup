import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { TOKENS, alpha } from "./messages.js";
import { cachedDoc, cachedUserDoc, readDoc, readUserDoc, updateDoc } from "./doc.js";
import { gardenDay, water } from "./garden.js";

const DOC = "zikr";
const HIM = "j";
const HIS_COLOR = TOKENS.gold;
const RING = TOKENS.gold;
const HER_COLOR = "#7FB2A6";
const ROUND = 33;
// Taps are saved in batches, this long after the last one.
const SAVE_AFTER_MS = 1200;

const PHRASES = [
  { id: "subhanallah", ar: "سُبْحَانَ ٱللَّٰهِ", tr: "SubhanAllah", meaning: "Glory be to Allah" },
  { id: "alhamdulillah", ar: "ٱلْحَمْدُ لِلَّٰهِ", tr: "Alhamdulillah", meaning: "All praise is for Allah" },
  { id: "allahuakbar", ar: "ٱللَّٰهُ أَكْبَرُ", tr: "Allahu Akbar", meaning: "Allah is the Greatest" },
  { id: "lailahaillallah", ar: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ", tr: "La ilaha illallah", meaning: "There is no god but Allah" },
  { id: "astaghfirullah", ar: "أَسْتَغْفِرُ ٱللَّٰهَ", tr: "Astaghfirullah", meaning: "I seek Allah's forgiveness" },
];

const PICK_KEY = "zikr-phrase";

function stored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

const dayTotal = (doc, day) => Object.values((doc && doc.days && doc.days[day]) || {}).reduce((a, b) => a + b, 0);

/**
 * A tasbih. Counts are kept per day and per phrase in your own document:
 * `days[day][phrase] = count`. Taps are added to whatever the server holds
 * rather than overwriting it, so counting on the phone and then carrying on
 * on the laptop adds up. Two devices saving in the very same moment can
 * still lose one batch — KV has no transactions.
 */
export default function ZikrApp({ me }) {
  const them = me === HIM ? "g" : HIM;
  const theirName = me === HIM ? "Ganira" : "Javanshir";
  const [phrase, setPhrase] = useState(() => {
    const saved = stored(PICK_KEY, PHRASES[0].id);
    return PHRASES.some((p) => p.id === saved) ? saved : PHRASES[0].id;
  });
  const [doc, setDoc] = useState(() => cachedDoc(DOC) || {});
  const [theirs, setTheirs] = useState(() => cachedUserDoc(them, DOC) || {});
  // Taps not yet on the server, by phrase.
  const pending = useRef({});
  const timer = useRef(null);
  const [pulse, setPulse] = useState(0);

  const today = gardenDay();
  const counts = (doc.days && doc.days[today]) || {};
  const count = counts[phrase] || 0;
  const inRound = count % ROUND;
  const rounds = Math.floor(count / ROUND);
  const current = PHRASES.find((p) => p.id === phrase);

  useEffect(() => {
    let cancelled = false;
    readDoc(DOC).then((d) => {
      if (!cancelled && d) setDoc(d);
    });
    readUserDoc(them, DOC).then((d) => {
      if (!cancelled && d) setTheirs(d);
    });
    return () => {
      cancelled = true;
    };
  }, [them]);

  const flush = async () => {
    clearTimeout(timer.current);
    const sending = pending.current;
    if (!Object.keys(sending).length) return;
    pending.current = {};
    const day = gardenDay();
    const saved = await updateDoc(DOC, (latest) => {
      const days = { ...(latest.days || {}) };
      const todays = { ...(days[day] || {}) };
      for (const [id, n] of Object.entries(sending)) todays[id] = (todays[id] || 0) + n;
      days[day] = todays;
      return { ...latest, days, updated: new Date().toISOString() };
    });
    if (saved) {
      // Keep any taps made while this was in flight on top of the saved copy.
      setDoc(() => {
        const days = { ...(saved.days || {}) };
        const todays = { ...(days[day] || {}) };
        for (const [id, n] of Object.entries(pending.current)) todays[id] = (todays[id] || 0) + n;
        days[day] = todays;
        return { ...saved, days };
      });
    } else {
      // Not saved: put the taps back so the next save carries them.
      for (const [id, n] of Object.entries(sending)) pending.current[id] = (pending.current[id] || 0) + n;
    }
  };

  // Save what is left when leaving the page or putting the phone away.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, []);

  const tap = () => {
    const next = count + 1;
    setDoc((d) => {
      const days = { ...(d.days || {}) };
      days[today] = { ...(days[today] || {}), [phrase]: next };
      return { ...d, days };
    });
    pending.current[phrase] = (pending.current[phrase] || 0) + 1;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_AFTER_MS);
    setPulse((p) => p + 1);
    const roundDone = next % ROUND === 0;
    try {
      navigator.vibrate?.(roundDone ? [40, 60, 40] : 8);
    } catch {
      /* no vibration on this device */
    }
    // A finished round waters the pomegranate in the garden.
    if (roundDone) water("pomegranate");
  };

  const pick = (id) => {
    setPhrase(id);
    try {
      localStorage.setItem(PICK_KEY, id);
    } catch {
      /* private mode */
    }
  };

  const R = 92;
  const circumference = 2 * Math.PI * R;
  const myToday = dayTotal(doc, today);
  const theirToday = dayTotal(theirs, today);

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        Zikr
      </p>
      <p style={{ color: TOKENS.gold, fontSize: 11.5, textAlign: "center", opacity: 0.75 }} className="mb-4">
        tap the circle to count — every {ROUND} waters the pomegranate
      </p>

      <div className="w-full flex gap-1.5 mb-5" style={{ flexWrap: "wrap", justifyContent: "center" }}>
        {PHRASES.map((p) => (
          <button
            key={p.id}
            onClick={() => pick(p.id)}
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: "5px 11px",
              borderRadius: 9999,
              border: `1px solid ${phrase === p.id ? alpha(TOKENS.gold, "66") : TOKENS.line}`,
              color: phrase === p.id ? TOKENS.gold : TOKENS.muted,
            }}
          >
            {p.tr}
          </button>
        ))}
      </div>

      <motion.button
        onClick={tap}
        whileTap={{ scale: 0.97 }}
        aria-label={`Count ${current.tr}, ${inRound} of ${ROUND}`}
        style={{
          position: "relative",
          width: 232,
          height: 232,
          borderRadius: 9999,
          background: `radial-gradient(circle at 50% 40%, ${TOKENS.bgCardEdge}, ${TOKENS.bgCard})`,
          border: `1px solid ${TOKENS.line}`,
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
          userSelect: "none",
        }}
      >
        <svg width={232} height={232} viewBox="0 0 232 232" style={{ position: "absolute", inset: 0 }}>
          <circle cx={116} cy={116} r={R} fill="none" stroke={TOKENS.line} strokeWidth={6} />
          <circle
            cx={116}
            cy={116}
            r={R}
            fill="none"
            stroke={RING}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - inRound / ROUND)}
            transform="rotate(-90 116 116)"
            style={{ transition: "stroke-dashoffset 0.25s ease" }}
          />
        </svg>
        <motion.div key={pulse} initial={{ scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 0.18 }} className="flex flex-col items-center justify-center" style={{ position: "absolute", inset: 0 }}>
          <span dir="rtl" lang="ar" style={{ color: TOKENS.gold, fontFamily: "'Amiri', serif", fontSize: 25, lineHeight: 1.6 }}>
            {current.ar}
          </span>
          <span style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 44, fontWeight: 600, lineHeight: 1.1 }}>{inRound}</span>
          <span style={{ color: TOKENS.muted, fontSize: 11 }}>of {ROUND}</span>
        </motion.div>
      </motion.button>

      <p style={{ color: TOKENS.cream, fontSize: 13, textAlign: "center" }} className="mt-4">
        {current.meaning}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mt-1">
        {count} today{rounds > 0 && ` · ${rounds} ${rounds === 1 ? "round" : "rounds"}`}
      </p>

      <div className="flex items-center gap-4 mt-5" style={{ fontSize: 11 }}>
        <span style={{ color: me === HIM ? HIS_COLOR : HER_COLOR }}>You {myToday}</span>
        <span style={{ color: me === HIM ? HER_COLOR : HIS_COLOR }}>
          {theirName} {theirToday}
        </span>
        <span style={{ color: TOKENS.muted }}>today</span>
      </div>

      {inRound > 0 && (
        <button
          onClick={() => {
            // Starts the round over by setting the count back to the last full round.
            const back = inRound;
            setDoc((d) => {
              const days = { ...(d.days || {}) };
              days[today] = { ...(days[today] || {}), [phrase]: count - back };
              return { ...d, days };
            });
            pending.current[phrase] = (pending.current[phrase] || 0) - back;
            clearTimeout(timer.current);
            timer.current = setTimeout(flush, SAVE_AFTER_MS);
          }}
          style={{ color: TOKENS.muted, fontSize: 11.5 }}
          className="flex items-center gap-1.5 mt-5"
        >
          <RotateCcw size={12} /> Start this round over
        </button>
      )}
    </div>
  );
}
