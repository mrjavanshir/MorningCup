import React, { useEffect, useRef, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { TOKENS, SCRATCH_MESSAGES } from "./messages.js";

const REVEAL_THRESHOLD = 0.55;
const BRUSH = 18;

function pickIndex(exclude) {
  if (SCRATCH_MESSAGES.length <= 1) return 0;
  let next = Math.floor(Math.random() * SCRATCH_MESSAGES.length);
  while (next === exclude) next = Math.floor(Math.random() * SCRATCH_MESSAGES.length);
  return next;
}

export default function ScratchGame() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef(null);
  const movesRef = useRef(0);

  const [messageIndex, setMessageIndex] = useState(() => pickIndex(null));
  const [revealed, setRevealed] = useState(false);
  const [round, setRound] = useState(0);

  const message = SCRATCH_MESSAGES[messageIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = wrapRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";

    const foil = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    foil.addColorStop(0, "#B8912F");
    foil.addColorStop(0.45, "#E9D9A6");
    foil.addColorStop(0.55, "#F2E7C4");
    foil.addColorStop(1, "#A8842A");
    ctx.fillStyle = foil;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.fillStyle = "rgba(23,13,17,0.38)";
    ctx.font = "700 12px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "2px";
    ctx.fillText("SCRATCH HERE", rect.width / 2, rect.height / 2 + 4);
  }, [round]);

  const scratchedPct = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const stride = 4 * 16;
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += stride) {
      total++;
      if (data[i] === 0) clear++;
    }
    return total === 0 ? 0 : clear / total;
  };

  const scratchAt = (x, y) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = BRUSH * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const last = lastRef.current;
    if (last) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, BRUSH, 0, Math.PI * 2);
    ctx.fill();
    lastRef.current = { x, y };
  };

  const posOf = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e) => {
    if (revealed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = null;
    const p = posOf(e);
    scratchAt(p.x, p.y);
  };

  const onMove = (e) => {
    if (!drawingRef.current || revealed) return;
    const p = posOf(e);
    scratchAt(p.x, p.y);
    movesRef.current += 1;
    if (movesRef.current % 12 === 0 && scratchedPct() > REVEAL_THRESHOLD) setRevealed(true);
  };

  const onUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastRef.current = null;
    if (!revealed && scratchedPct() > REVEAL_THRESHOLD) setRevealed(true);
  };

  const scratchAnother = () => {
    setMessageIndex((i) => pickIndex(i));
    setRevealed(false);
    movesRef.current = 0;
    setRound((r) => r + 1);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {revealed ? "Congratulations )" : "Scratch the card to see what you won"}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-6">
        {revealed ? " " : "Drag your finger across the gold"}
      </p>

      <div
        ref={wrapRef}
        style={{
          position: "relative",
          width: "100%",
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${revealed ? TOKENS.gold + "55" : TOKENS.line}`,
          background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
          boxShadow: "0 14px 32px rgba(0,0,0,0.4)",
          marginBottom: 18,
        }}
      >
        <div style={{ padding: "26px 22px", minHeight: 172, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} color={TOKENS.gold} />
            <span style={{ color: TOKENS.gold, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
              {message.cat}
            </span>
          </div>
          <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 17, lineHeight: 1.45 }}>{message.text}</p>
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          aria-label="Scratch card"
          style={{
            position: "absolute",
            inset: 0,
            touchAction: "none",
            cursor: revealed ? "default" : "pointer",
            opacity: revealed ? 0 : 1,
            pointerEvents: revealed ? "none" : "auto",
            transition: revealed ? "opacity 0.45s ease" : "none",
          }}
        />
      </div>

      {revealed && (
        <button
          onClick={scratchAnother}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
          className="cf-fade w-full h-12 rounded-full flex items-center justify-center gap-2"
        >
          <RefreshCw size={15} /> Scratch another
        </button>
      )}
    </div>
  );
}
