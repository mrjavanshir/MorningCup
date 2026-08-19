import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { TOKENS, alpha } from "./messages.js";
import { cachedDoc, docsAvailable, readDoc, updateDoc } from "./doc.js";

const DOC = "khatm";
const JUZ_COUNT = 30;
const HIM = "j";
const HER = "g";
const HIS_COLOR = TOKENS.gold;
const HER_COLOR = "#7FB2A6";

export default function KhatmGame({ isOwner }) {
  const me = isOwner ? HIM : HER;
  const [juz, setJuz] = useState(() => cachedDoc(DOC)?.juz || {});
  const [status, setStatus] = useState("loading"); // loading | ready | saving | offline
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await readDoc(DOC);
      if (cancelled) return;
      if (data) setJuz(data.juz || {});
      setStatus(data ? "ready" : "offline");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mine = Object.values(juz).filter((v) => v === me).length;
  const theirs = Object.values(juz).filter((v) => v && v !== me).length;
  const done = mine + theirs;
  const complete = done === JUZ_COUNT;

  const toggle = async (n) => {
    const key = String(n);
    const current = juz[key];
    // Only ever touch your own marks — clearing the other person's reading
    // would be the one destructive thing this screen could do.
    if (current && current !== me) return;

    const optimistic = { ...juz };
    if (current === me) delete optimistic[key];
    else optimistic[key] = me;
    setJuz(optimistic);
    setStatus("saving");

    const saved = await updateDoc(DOC, (latest) => {
      const next = { ...(latest.juz || {}) };
      const theirMark = next[key];
      if (theirMark && theirMark !== me) return latest; // they claimed it first
      if (current === me) delete next[key];
      else next[key] = me;
      return { ...latest, juz: next, updated: new Date().toISOString() };
    });

    if (saved) {
      setJuz(saved.juz || {});
      setStatus("ready");
    } else {
      setJuz(juz); // put it back; nothing was stored
      setStatus("offline");
    }
  };

  const reset = async () => {
    setConfirmReset(false);
    setStatus("saving");
    const saved = await updateDoc(DOC, () => ({ juz: {}, started: new Date().toISOString() }));
    setJuz(saved ? saved.juz || {} : {});
    setStatus(saved ? "ready" : "offline");
  };

  if (!docsAvailable()) {
    return (
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mt-6">
        This one needs the store — set VITE_STORE_URL and rebuild.
      </p>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {complete ? "That's the whole Qur'an )" : "A khatm, between the two of you"}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-5">
        {status === "loading" ? "Loading…" : `${done} of ${JUZ_COUNT} juz read`}
      </p>

      <div style={{ width: "100%", height: 8, borderRadius: 9999, background: TOKENS.line, overflow: "hidden", display: "flex" }} className="mb-2">
        <motion.div
          animate={{ width: `${(mine / JUZ_COUNT) * 100}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
          style={{ background: HIS_COLOR }}
        />
        <motion.div
          animate={{ width: `${(theirs / JUZ_COUNT) * 100}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
          style={{ background: HER_COLOR }}
        />
      </div>
      <div className="flex items-center gap-4 mb-5" style={{ fontSize: 11 }}>
        <span style={{ color: HIS_COLOR, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: HIS_COLOR }} />
          {isOwner ? "You" : "Javanshir"} {mine !== null && (isOwner ? mine : theirs)}
        </span>
        <span style={{ color: HER_COLOR, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: HER_COLOR }} />
          {isOwner ? "Ganira" : "You"} {isOwner ? theirs : mine}
        </span>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))", gap: 8, width: "100%" }}
        className="mb-5"
      >
        {Array.from({ length: JUZ_COUNT }, (_, i) => i + 1).map((n) => {
          const owner = juz[String(n)];
          const isMine = owner === me;
          const isTheirs = owner && owner !== me;
          const color = owner === HIM ? HIS_COLOR : owner === HER ? HER_COLOR : null;
          return (
            <motion.button
              key={n}
              onClick={() => toggle(n)}
              whileTap={isTheirs ? undefined : { scale: 0.93 }}
              aria-label={`Juz ${n}${isMine ? ", read by you" : isTheirs ? ", read by them" : ""}`}
              style={{
                aspectRatio: "1",
                borderRadius: 10,
                border: `1px solid ${color ? `${alpha(color, "88")}` : TOKENS.line}`,
                background: color ? `${alpha(color, "22")}` : "transparent",
                color: color || TOKENS.muted,
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isTheirs ? "default" : "pointer",
              }}
            >
              {n}
            </motion.button>
          );
        })}
      </div>

      <p style={{ color: TOKENS.muted, fontSize: 10.5, textAlign: "center", opacity: 0.75 }} className="mb-4">
        {status === "offline"
          ? "Can't reach the store — marks won't save right now."
          : "Tap a juz when you've read it. You can only clear your own."}
      </p>

      {done > 0 &&
        (confirmReset ? (
          <div className="flex items-center gap-3">
            <span style={{ color: TOKENS.muted, fontSize: 11 }}>Start a new khatm?</span>
            <button onClick={reset} style={{ color: "#C4184F", fontSize: 11, fontWeight: 700 }}>
              Reset
            </button>
            <button onClick={() => setConfirmReset(false)} style={{ color: TOKENS.muted, fontSize: 11 }}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            style={{ color: TOKENS.muted, fontSize: 11, opacity: 0.7 }}
            className="flex items-center gap-1.5"
          >
            <RotateCcw size={12} /> Start a new khatm
          </button>
        ))}
    </div>
  );
}
