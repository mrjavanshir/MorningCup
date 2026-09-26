import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, Droplet } from "lucide-react";
import { TOKENS, alpha } from "./messages.js";
import GardenScene from "./GardenScene.jsx";
import { cachedGarden, PLANTS, plantState, readGarden, STAGES } from "./garden.js";

const HIM = "j";
const HIS_COLOR = TOKENS.gold;
const HER_COLOR = "#7FB2A6";
const colorOf = (id) => (id === HIM ? HIS_COLOR : HER_COLOR);

function useGarden() {
  const [doc, setDoc] = useState(() => cachedGarden() || {});
  useEffect(() => {
    let cancelled = false;
    readGarden().then((d) => {
      if (!cancelled && d) setDoc(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return doc;
}

const plantsOf = (doc) => PLANTS.map((p) => ({ ...p, ...plantState(doc, p.id) }));

function when(daysSince) {
  if (daysSince === 0) return "today";
  if (daysSince === 1) return "yesterday";
  return `${daysSince} days ago`;
}

/** The small garden at the top of the hub; tapping it opens the full one. */
export function GardenWidget({ me, onOpen }) {
  const plants = plantsOf(useGarden());
  const thirsty = plants.filter((p) => p.thirsty);
  const allMineToday = plants.every((p) => p.wateredToday[me]);
  const line = thirsty.length
    ? `${thirsty.map((p) => p.name).join(" and ")} ${thirsty.length === 1 ? "is" : "are"} thirsty`
    : allMineToday
      ? "You've watered everything today"
      : "Grows a little every day either of you reads";

  return (
    <motion.button
      onClick={onOpen}
      whileTap={{ scale: 0.99 }}
      style={{
        width: "100%",
        background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
        border: `1px solid ${TOKENS.line}`,
        borderRadius: 16,
        padding: "10px 12px 12px",
        textAlign: "left",
      }}
      className="mb-5"
    >
      <GardenScene plants={plants} height={92} />
      <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
        <div>
          <div style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600 }}>Our garden</div>
          <div style={{ color: thirsty.length ? "#D9A441" : TOKENS.muted, fontSize: 11.5, marginTop: 1 }}>{line}</div>
        </div>
        <ChevronRight size={16} color={TOKENS.muted} />
      </div>
    </motion.button>
  );
}

export default function GardenApp({ me, onOpenApp }) {
  const doc = useGarden();
  const plants = plantsOf(doc);
  const nameOf = (id) => (id === me ? "you" : id === HIM ? "Javanshir" : "Ganira");

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        Our garden
      </p>
      <p style={{ color: TOKENS.gold, fontSize: 11.5, textAlign: "center", opacity: 0.75 }} className="mb-4">
        three plants, grown by what the two of you read
      </p>

      <div
        style={{
          width: "100%",
          background: `linear-gradient(180deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
          border: `1px solid ${TOKENS.line}`,
          borderRadius: 16,
          padding: "8px 6px 4px",
        }}
        className="mb-4"
      >
        <GardenScene plants={plants} />
      </div>

      <div className="w-full flex flex-col gap-2.5">
        {plants.map((p) => {
          const next = STAGES[p.stage + 1];
          const who = p.last ? p.last.who : [];
          const status = !p.last
            ? "Not watered yet"
            : p.thirsty
              ? `Thirsty — last watered ${when(p.daysSince)}`
              : who.length === 2 && p.daysSince === 0
                ? "Watered today by both of you"
                : `Last watered ${when(p.daysSince)} by ${who.map(nameOf).join(" and ")}`;
          return (
            <div
              key={p.id}
              style={{
                background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
                border: `1px solid ${p.thirsty ? alpha("#D9A441", "66") : TOKENS.line}`,
                borderRadius: 14,
                padding: "12px 14px",
              }}
            >
              <div className="flex items-baseline justify-between">
                <span style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 16 }}>{p.name}</span>
                <span style={{ color: TOKENS.gold, fontSize: 11, fontWeight: 700 }}>{p.stageName}</span>
              </div>

              <div style={{ height: 5, borderRadius: 9999, background: TOKENS.line, marginTop: 8 }}>
                <motion.div
                  initial={false}
                  animate={{ width: `${Math.round(p.progress * 100)}%` }}
                  transition={{ type: "spring", stiffness: 160, damping: 24 }}
                  style={{ height: "100%", borderRadius: 9999, background: p.thirsty ? "#D9A441" : "#6FA055" }}
                />
              </div>
              <div className="flex items-center justify-between" style={{ marginTop: 6, fontSize: 11 }}>
                <span style={{ color: p.thirsty ? "#D9A441" : TOKENS.muted }}>{status}</span>
                <span style={{ color: TOKENS.muted }}>{next ? `${p.toNext} to ${next.name.toLowerCase()}` : "fully grown"}</span>
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
                <span className="flex items-center gap-2" style={{ fontSize: 10.5, color: TOKENS.muted }}>
                  Today
                  {[HIM, "g"].map((id) => (
                    <span key={id} className="flex items-center gap-1">
                      <Droplet size={11} color={colorOf(id)} fill={p.wateredToday[id] ? colorOf(id) : "none"} />
                      <span style={{ color: p.wateredToday[id] ? colorOf(id) : TOKENS.muted }}>{id === me ? "You" : nameOf(id)}</span>
                    </span>
                  ))}
                </span>
                <button onClick={() => onOpenApp(p.app)} style={{ color: TOKENS.gold, fontSize: 11, fontWeight: 700 }} className="flex items-center gap-0.5">
                  {p.source.replace(/^grows when you /, "")} <ChevronRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ color: TOKENS.muted, fontSize: 11, textAlign: "center", lineHeight: 1.5 }} className="mt-5">
        Each plant can be watered once a day by each of you — the day you both do counts triple.
        <br />
        Left alone for a few days, a plant looks thirsty, but it never loses what it has grown.
      </p>
    </div>
  );
}
