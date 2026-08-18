import React, { useState } from "react";
import { SUN_MESSAGES, TOKENS, pickMessage } from "./messages.js";
import NoteResult from "./NoteResult.jsx";

const STEPS = 5;

export default function SunGame() {
  const [fill, setFill] = useState(0);
  const [message, setMessage] = useState(() => pickMessage(null, SUN_MESSAGES));

  const done = fill >= STEPS;
  const pct = fill / STEPS;

  const rise = () => {
    if (done) return;
    setFill((f) => f + 1);
  };

  const again = () => {
    setMessage((m) => pickMessage(m, SUN_MESSAGES));
    setFill(0);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13.5, textAlign: "center" }} className="mb-8">
        {done ? "Günəş doğdu )" : "Günəşi qaldırmaq üçün toxun"}
      </p>

      <button
        onClick={rise}
        disabled={done}
        aria-label={done ? "Günəş doğdu" : `Günəşi qaldır, ${fill} / ${STEPS}`}
        className="sn-sun-btn"
        style={{
          position: "relative",
          width: 200,
          height: 170,
          marginBottom: 26,
          overflow: "hidden",
          borderRadius: 20,
          background: `linear-gradient(180deg, ${TOKENS.bgCard}, ${TOKENS.bgDeep})`,
          border: `1px solid ${TOKENS.line}`,
          cursor: done ? "default" : "pointer",
          padding: 0,
        }}
      >
        <div
          className="sn-rays"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 40 + pct * 60,
            width: 160,
            height: 160,
            transform: "translate(-50%, 50%)",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${TOKENS.glow}55 0%, transparent 70%)`,
            transition: "bottom 0.35s cubic-bezier(.4,1.2,.5,1)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 40 + pct * 60,
            width: 64,
            height: 64,
            transform: "translate(-50%, 50%)",
            borderRadius: "50%",
            background: `linear-gradient(180deg, #F2C878, ${TOKENS.gold})`,
            boxShadow: `0 0 30px ${TOKENS.glow}66`,
            transition: "bottom 0.35s cubic-bezier(.4,1.2,.5,1)",
          }}
        />
        <div style={{ position: "absolute", left: -20, right: -20, bottom: -30, height: 90, borderRadius: "50%", background: TOKENS.bgCardEdge }} />
        <div style={{ position: "absolute", left: -30, right: -30, bottom: -46, height: 90, borderRadius: "50%", background: TOKENS.bgDeep, opacity: 0.9 }} />
      </button>

      {!done && (
        <div className="flex gap-1.5 mb-2">
          {Array.from({ length: STEPS }).map((_, i) => (
            <span key={i} style={{ width: 7, height: 7, borderRadius: 9999, background: i < fill ? TOKENS.gold : TOKENS.line }} />
          ))}
        </div>
      )}

      {done && <NoteResult message={message} onAgain={again} againLabel="Yenidən qaldır" />}
    </div>
  );
}
