import React, { useMemo, useState } from "react";
import { MESSAGES, TOKENS, pickMessage } from "./messages.js";
import NoteResult from "./NoteResult.jsx";

const STEPS = 6;

function buildSteam() {
  return [
    { left: 42, delay: 0, dur: 2.6 },
    { left: 50, delay: 0.5, dur: 3 },
    { left: 58, delay: 1, dur: 2.8 },
  ];
}

export default function CupGame() {
  const [fill, setFill] = useState(0);
  const [message, setMessage] = useState(() => pickMessage());
  const steam = useMemo(() => buildSteam(), []);

  const done = fill >= STEPS;
  const pct = (fill / STEPS) * 100;

  const pour = () => {
    if (done) return;
    setFill((f) => f + 1);
  };

  const again = () => {
    setMessage((m) => pickMessage(m));
    setFill(0);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13.5, textAlign: "center" }} className="mb-8">
        {done ? "Fincan hazırdır )" : "Fincanı doldurmaq üçün toxun"}
      </p>

      {/* Cup */}
      <div style={{ position: "relative", width: 200, height: 210, marginBottom: 26 }}>
        {/* Steam */}
        {done && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, pointerEvents: "none" }}>
            {steam.map((s, i) => (
              <span
                key={i}
                className="cf-steam"
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: `${s.left}%`,
                  width: 8,
                  height: 26,
                  borderRadius: 9999,
                  background: "rgba(243,231,218,0.5)",
                  filter: "blur(4px)",
                  animationDuration: `${s.dur}s`,
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Handle */}
        <div
          style={{
            position: "absolute",
            right: 2,
            top: 96,
            width: 44,
            height: 54,
            border: `9px solid ${TOKENS.cream}`,
            borderLeft: "none",
            borderRadius: "0 9999px 9999px 0",
            opacity: 0.9,
          }}
        />

        {/* Cup body */}
        <button
          onClick={pour}
          disabled={done}
          aria-label={done ? "Fincan doludur" : `Fincanı doldur, ${fill} / ${STEPS}`}
          className="cf-cup"
          style={{
            position: "absolute",
            left: 22,
            top: 66,
            width: 132,
            height: 128,
            borderRadius: "14px 14px 46px 46px",
            background: TOKENS.cream,
            overflow: "hidden",
            boxShadow: "0 14px 30px rgba(0,0,0,0.45)",
            transition: "transform 0.1s",
            cursor: done ? "default" : "pointer",
            padding: 0,
            border: "none",
          }}
        >
          {/* Coffee */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: `${pct * 0.86}%`,
              background: "linear-gradient(180deg,#6B3E22,#3A1F12)",
              transition: "height 0.35s cubic-bezier(.4,1.2,.5,1)",
            }}
          >
            <div
              style={{ position: "absolute", top: -3, left: 0, right: 0, height: 6, background: "rgba(200,150,100,0.45)", borderRadius: "50%" }}
            />
          </div>
          {/* Inner shading */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(100deg, rgba(0,0,0,0.06), transparent 45%, rgba(0,0,0,0.09))",
              pointerEvents: "none",
            }}
          />
        </button>

        {/* Saucer */}
        <div
          style={{
            position: "absolute",
            left: 4,
            bottom: 0,
            width: 176,
            height: 16,
            borderRadius: "50%",
            background: TOKENS.cream,
            opacity: 0.85,
            boxShadow: "0 8px 18px rgba(0,0,0,0.4)",
          }}
        />
      </div>

      {/* Fill dots */}
      {!done && (
        <div className="flex gap-1.5 mb-2">
          {Array.from({ length: STEPS }).map((_, i) => (
            <span key={i} style={{ width: 7, height: 7, borderRadius: 9999, background: i < fill ? TOKENS.gold : TOKENS.line }} />
          ))}
        </div>
      )}

      {done && <NoteResult message={message} onAgain={again} againLabel="Bir fincan da" />}
    </div>
  );
}
