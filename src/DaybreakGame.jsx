import React, { useState, useRef } from "react";
import { TOKENS, DAYBREAK_MESSAGES } from "./messages.js";
import NoteResult from "./NoteResult.jsx";

const SCENE_H = 240;
const GROUND_Y = SCENE_H * 0.78;
const SUN_TOP_MAX = 22;
const RISE_THRESHOLD = 82;

const STARS = [
  { t: 10, l: 12 }, { t: 18, l: 30 }, { t: 8, l: 55 }, { t: 22, l: 72 },
  { t: 14, l: 88 }, { t: 30, l: 20 }, { t: 28, l: 45 }, { t: 34, l: 63 },
];

export default function DaybreakGame() {
  const [pct, setPct] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const [index, setIndex] = useState(0);
  const sceneRef = useRef(null);
  const message = DAYBREAK_MESSAGES[index];

  const updateFromClientY = (clientY) => {
    const rect = sceneRef.current.getBoundingClientRect();
    const y = Math.min(Math.max(clientY - rect.top, 0), SCENE_H);
    setPct(100 - (y / SCENE_H) * 100);
  };

  const onDown = (e) => {
    if (done) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    updateFromClientY(e.clientY);
  };
  const onMove = (e) => {
    if (!dragging || done) return;
    updateFromClientY(e.clientY);
  };
  const onUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (pct >= RISE_THRESHOLD) {
      setPct(100);
      setDone(true);
    } else {
      setPct(0);
    }
  };

  const again = () => {
    setIndex((i) => (i + 1) % DAYBREAK_MESSAGES.length);
    setDone(false);
    setPct(0);
  };

  const nightOpacity = Math.max(0, 1 - pct / 50);
  const sunriseOpacity = Math.max(0, 1 - Math.abs(pct - 50) / 50);
  const dayOpacity = Math.max(0, (pct - 45) / 55);
  const sunTop = GROUND_Y - (pct / 100) * (GROUND_Y - SUN_TOP_MAX);
  const glow = 10 + (pct / 100) * 30;

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13.5, textAlign: "center" }} className="mb-6">
        {done ? "The sun is up )" : "Drag the sun up to start the day"}
      </p>

      <div
        ref={sceneRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        style={{
          position: "relative",
          width: "100%",
          height: SCENE_H,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 16px 34px rgba(0,0,0,0.4)",
          touchAction: "none",
          cursor: done ? "default" : "grab",
          marginBottom: 16,
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#0B0716,#241A3A)", opacity: nightOpacity }}>
          {STARS.map((s, i) => (
            <span
              key={i}
              className="db-star"
              style={{ position: "absolute", top: `${s.t}%`, left: `${s.l}%`, width: 3, height: 3, borderRadius: 9999, background: TOKENS.cream }}
            />
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#7A3B5A,#E88D5B 55%,#F6C453)", opacity: sunriseOpacity }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#5EA8D9,#BFE3F0)", opacity: dayOpacity }} />

        <div
          style={{
            position: "absolute",
            top: sunTop,
            left: "50%",
            transform: "translateX(-50%)",
            width: 52,
            height: 52,
            borderRadius: 9999,
            background: "radial-gradient(circle at 35% 30%, #FFE9B0, #F6C453)",
            boxShadow: `0 0 ${glow}px ${glow / 1.5}px rgba(246,196,83,0.55)`,
            transition: dragging ? "none" : "top 0.4s ease-out",
            zIndex: 1,
          }}
        />

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: GROUND_Y + 20, background: "#16261C", pointerEvents: "none", zIndex: 2 }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: GROUND_Y,
            height: 22,
            background: "#1D3327",
            borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      </div>

      {!done && <p style={{ color: TOKENS.muted, fontSize: 12 }} className="mb-2">{Math.round(pct)}%</p>}

      {done && <NoteResult message={message} onAgain={again} againLabel="Bring it up again" />}
    </div>
  );
}
