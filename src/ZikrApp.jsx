import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
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
const MAX_CUSTOM = 20;
const MAX_LENGTH = 60;

const isArabic = (text) => /[\u0600-\u06FF]/.test(text);
const sameText = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Your own phrases sit after the five fixed ones; only yours can be removed. */
function phrasesOf(doc) {
  const custom = Array.isArray(doc.custom) ? doc.custom : [];
  return [
    ...PHRASES,
    ...custom.map((c) => ({ id: c.id, custom: true, text: c.text, tr: c.text, ar: isArabic(c.text) ? c.text : null })),
  ];
}

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
  const [doc, setDoc] = useState(() => cachedDoc(DOC) || {});
  const [phrase, setPhrase] = useState(() => stored(PICK_KEY, PHRASES[0].id));
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [theirs, setTheirs] = useState(() => cachedUserDoc(them, DOC) || {});
  // Taps not yet on the server, by phrase.
  const pending = useRef({});
  const timer = useRef(null);
  // This device's writes go out one after another, so saving taps and
  // changing the list never overwrite each other.
  const queue = useRef(Promise.resolve());
  const inTurn = (job) => {
    queue.current = queue.current.then(job, job);
    return queue.current;
  };
  const [pulse, setPulse] = useState(0);

  const today = gardenDay();
  const counts = (doc.days && doc.days[today]) || {};
  const phrases = phrasesOf(doc);
  // A remembered phrase that has since been removed falls back to the first.
  const current = phrases.find((p) => p.id === phrase) || PHRASES[0];
  const count = counts[current.id] || 0;
  const inRound = count % ROUND;
  const rounds = Math.floor(count / ROUND);

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

  const flush = () => {
    clearTimeout(timer.current);
    return inTurn(saveTaps);
  };

  const saveTaps = async () => {
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
      days[today] = { ...(days[today] || {}), [current.id]: next };
      return { ...d, days };
    });
    pending.current[current.id] = (pending.current[current.id] || 0) + 1;
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

  const addPhrase = async (e) => {
    e.preventDefault();
    const text = draft.trim().replace(/\s+/g, " ");
    if (!text) return setDraftError("Write the zikr first.");
    if (text.length > MAX_LENGTH) return setDraftError(`Keep it under ${MAX_LENGTH} characters.`);
    if (phrases.some((p) => sameText(p.tr, text) || (p.ar && sameText(p.ar, text)))) return setDraftError("That one is already on the list.");
    if (phrases.length - PHRASES.length >= MAX_CUSTOM) return setDraftError(`You can keep up to ${MAX_CUSTOM} of your own.`);
    const entry = { id: `c-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, text, at: new Date().toISOString() };
    const withIt = (d) => {
      const list = Array.isArray(d.custom) ? d.custom : [];
      return list.some((c) => c.id === entry.id) ? d : { ...d, custom: [...list, entry] };
    };
    setDoc((d) => withIt(d));
    pick(entry.id);
    setDraft("");
    setDraftError(null);
    setAdding(false);
    const saved = await inTurn(() => updateDoc(DOC, (latest) => ({ ...withIt(latest), updated: new Date().toISOString() })));
    if (saved) setDoc((d) => ({ ...saved, days: d.days }));
  };

  // Past counts for a removed phrase stay in the day totals; they were said.
  const removePhrase = async (id) => {
    if (confirmRemove !== id) return setConfirmRemove(id);
    setConfirmRemove(null);
    const without = (d) => ({ ...d, custom: (Array.isArray(d.custom) ? d.custom : []).filter((c) => c.id !== id) });
    setDoc((d) => without(d));
    pick(PHRASES[0].id);
    const saved = await inTurn(() => updateDoc(DOC, (latest) => ({ ...without(latest), updated: new Date().toISOString() })));
    if (saved) setDoc((d) => ({ ...saved, days: d.days }));
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
        {phrases.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              pick(p.id);
              setConfirmRemove(null);
            }}
            dir={p.ar && p.custom ? "rtl" : undefined}
            style={{
              fontSize: p.ar && p.custom ? 13 : 10.5,
              fontFamily: p.ar && p.custom ? "'Amiri', serif" : undefined,
              fontWeight: 700,
              padding: "5px 11px",
              borderRadius: 9999,
              maxWidth: 170,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              border: `1px solid ${current.id === p.id ? alpha(TOKENS.gold, "66") : p.custom ? alpha(TOKENS.gold, "2A") : TOKENS.line}`,
              color: current.id === p.id ? TOKENS.gold : TOKENS.muted,
            }}
          >
            {p.tr}
          </button>
        ))}
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            aria-label="Add your own zikr"
            style={{ fontSize: 10.5, fontWeight: 700, padding: "5px 10px", borderRadius: 9999, border: `1px dashed ${TOKENS.line}`, color: TOKENS.muted }}
            className="flex items-center gap-1"
          >
            <Plus size={11} /> Add
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={addPhrase} className="w-full flex flex-col gap-2 mb-5">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setDraftError(null);
            }}
            placeholder="e.g. SubhanAllahi wa bihamdihi — or in Arabic"
            maxLength={MAX_LENGTH + 20}
            autoFocus
            dir="auto"
            style={{
              width: "100%",
              background: TOKENS.bgDeep,
              border: `1px solid ${draftError ? "#C4184F" : TOKENS.line}`,
              borderRadius: 10,
              color: TOKENS.cream,
              fontFamily: isArabic(draft) ? "'Amiri', serif" : "'Manrope', sans-serif",
              fontSize: isArabic(draft) ? 18 : 14,
              padding: "10px 12px",
            }}
          />
          {draftError && <p style={{ color: "#E07A8F", fontSize: 12 }}>{draftError}</p>}
          <div className="flex items-center gap-4">
            <button type="submit" style={{ color: TOKENS.gold, fontSize: 12.5, fontWeight: 700 }}>
              Add to the list
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft("");
                setDraftError(null);
              }}
              style={{ color: TOKENS.muted, fontSize: 12.5 }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

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
          {current.ar ? (
            <span dir="rtl" lang="ar" style={{ display: "block", color: TOKENS.gold, fontFamily: "'Amiri', serif", fontSize: current.ar.length > 20 ? 18 : 25, lineHeight: 1.55, maxWidth: 148, whiteSpace: "normal", textAlign: "center" }}>
              {current.ar}
            </span>
          ) : (
            <span style={{ display: "block", color: TOKENS.gold, fontFamily: "'Fraunces', serif", fontSize: current.tr.length > 24 ? 14 : 18, lineHeight: 1.3, maxWidth: 148, whiteSpace: "normal", textAlign: "center", marginBottom: 4 }}>
              {current.tr}
            </span>
          )}
          <span style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 44, fontWeight: 600, lineHeight: 1.1 }}>{inRound}</span>
          <span style={{ color: TOKENS.muted, fontSize: 11 }}>of {ROUND}</span>
        </motion.div>
      </motion.button>

      {current.meaning && (
        <p style={{ color: TOKENS.cream, fontSize: 13, textAlign: "center" }} className="mt-4">
          {current.meaning}
        </p>
      )}
      {current.custom && (
        <button
          onClick={() => removePhrase(current.id)}
          style={{ color: confirmRemove === current.id ? "#E07A8F" : TOKENS.muted, fontSize: 11.5 }}
          className="flex items-center gap-1.5 mt-4"
        >
          <Trash2 size={12} /> {confirmRemove === current.id ? "Tap again to remove it" : "Remove from my list"}
        </button>
      )}
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
              days[today] = { ...(days[today] || {}), [current.id]: count - back };
              return { ...d, days };
            });
            pending.current[current.id] = (pending.current[current.id] || 0) - back;
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
