import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, Eye, EyeOff, Loader } from "lucide-react";
import { TOKENS, alpha } from "./messages.js";
import { fetchViews, ME, saveViews, THEM } from "./owner.js";
import { storeConfigured } from "./store.js";

const PEOPLE = [
  { id: THEM, label: "Ganira" },
  { id: ME, label: "You" },
];

export default function SharedSettings({ games, onBack, onSaved }) {
  const [who, setWho] = useState(THEM);
  const blank = () => Object.fromEntries(games.map((g) => [g.id, g.shared !== false]));
  const [views, setViews] = useState(() => ({ [ME]: blank(), [THEM]: blank() }));
  const visible = views[who];
  const [status, setStatus] = useState("loading"); // loading | ready | saving | saved | failed

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await fetchViews();
      if (cancelled) return;
      if (stored) {
        setViews((prev) =>
          Object.fromEntries(
            PEOPLE.map(({ id }) => [
              id,
              Object.fromEntries(games.map((g) => [g.id, stored[id]?.[g.id] ?? prev[id][g.id]])),
            ])
          )
        );
      }
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [games]);

  const toggle = (id) => setViews((prev) => ({ ...prev, [who]: { ...prev[who], [id]: !prev[who][id] } }));

  const save = async () => {
    setStatus("saving");
    const ok = await saveViews(views);
    if (ok && onSaved) onSaved(views);
    setStatus(ok ? "saved" : "failed");
    if (ok) setTimeout(() => setStatus("ready"), 2200);
  };

  const shownCount = Object.values(visible).filter(Boolean).length;

  if (!storeConfigured()) {
    return (
      <div className="w-full flex flex-col items-center mt-4">
        <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 17, textAlign: "center" }} className="mb-2">
          No store configured
        </p>
        <p style={{ color: TOKENS.muted, fontSize: 12.5, textAlign: "center" }} className="mb-5">
          These toggles have to reach her device, so they need the Worker. Set
          VITE_STORE_URL and rebuild.
        </p>
        <button onClick={onBack} style={{ color: TOKENS.muted, fontSize: 12.5 }}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-3">
        Who sees what
      </p>

      {/* One list per person — the admin sets both. */}
      <div className="flex items-center gap-2 mb-3">
        {PEOPLE.map((person) => (
          <button
            key={person.id}
            onClick={() => setWho(person.id)}
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: 9999,
              border: `1px solid ${who === person.id ? TOKENS.gold : TOKENS.line}`,
              color: who === person.id ? TOKENS.gold : TOKENS.muted,
            }}
          >
            {person.label}
          </button>
        ))}
      </div>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-5">
        {status === "loading" ? "Loading…" : `${shownCount} of ${games.length} on ${who === ME ? "your" : "her"} hub`}
      </p>

      <div className="w-full flex flex-col gap-2 mb-5">
        {games.map((g) => {
          const on = visible[g.id];
          const Icon = g.icon;
          return (
            <motion.button
              key={g.id}
              onClick={() => toggle(g.id)}
              whileTap={{ scale: 0.985 }}
              aria-label={`${on ? "Hide" : "Show"} ${g.title} for ${who === ME ? "you" : "Ganira"}`}
              style={{
                width: "100%",
                background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                border: `1px solid ${on ? `${alpha(TOKENS.gold, "55")}` : TOKENS.line}`,
                borderRadius: 14,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 11,
                opacity: on ? 1 : 0.5,
              }}
            >
              <Icon size={17} color={on ? TOKENS.gold : TOKENS.muted} style={{ flexShrink: 0 }} />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: "left",
                  color: TOKENS.cream,
                  fontFamily: "'Fraunces', serif",
                  fontSize: 14.5,
                }}
              >
                {g.title}
                {g.night && (
                  <span style={{ color: TOKENS.muted, fontSize: 10.5, marginLeft: 7, letterSpacing: 1 }}>NIGHT</span>
                )}
              </span>
              {on ? <Eye size={16} color={TOKENS.gold} /> : <EyeOff size={16} color={TOKENS.muted} />}
            </motion.button>
          );
        })}
      </div>

      <p style={{ color: TOKENS.muted, fontSize: 10.5, textAlign: "center", opacity: 0.75 }} className="mb-4">
        Hiding one only removes it from that list — a link already sent still opens it.
      </p>

      <motion.button
        onClick={save}
        disabled={status === "saving" || status === "loading"}
        whileTap={{ scale: 0.98 }}
        style={{
          background: status === "failed" ? "#C4184F" : TOKENS.gold,
          color: status === "failed" ? TOKENS.cream : TOKENS.bgDeep,
          fontWeight: 700,
          opacity: status === "saving" || status === "loading" ? 0.6 : 1,
        }}
        className="w-full h-12 rounded-full flex items-center justify-center gap-2 mb-3"
      >
        {status === "saving" && <Loader size={16} />}
        {status === "saved" && <Check size={16} />}
        {status === "saving"
          ? "Saving…"
          : status === "saved"
            ? "Saved — both hubs updated"
            : status === "failed"
              ? "Couldn't save, tap to retry"
              : "Save"}
      </motion.button>

      <button onClick={onBack} style={{ color: TOKENS.muted, fontSize: 12.5 }}>
        Back to the games
      </button>
    </div>
  );
}
