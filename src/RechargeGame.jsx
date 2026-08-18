import React, { useRef, useState } from "react";
import { BatteryCharging, Check, Heart, Link2, Send, Sun } from "lucide-react";
import { TOKENS, RECHARGE_MESSAGES, RECHARGE_TIPS } from "./messages.js";

const DIMENSIONS = [
  { key: "day", label: "Day so far" },
  { key: "energy", label: "Energy level" },
  { key: "happiness", label: "Happiness" },
];

const CHARGE_CONFIG = {
  day: { Icon: Sun, text: "Warming up your day..." },
  energy: { Icon: BatteryCharging, text: "Charging you up..." },
  happiness: { Icon: Heart, text: "Sending you some joy..." },
};

function encodeScores(scores, note) {
  return btoa(unescape(encodeURIComponent(JSON.stringify([scores, note]))));
}

function decodeScores(raw) {
  try {
    const val = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (!Array.isArray(val) || val.length !== 2) return null;
    const [scores, note] = val;
    if (!Array.isArray(scores) || scores.length !== DIMENSIONS.length) return null;
    if (scores.some((n) => typeof n !== "number" || n < 1 || n > 10)) return null;
    if (typeof note !== "string") return null;
    return { scores, note };
  } catch {
    return null;
  }
}

function encodeReply(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function decodeReply(raw) {
  try {
    return decodeURIComponent(escape(atob(raw)));
  } catch {
    return null;
  }
}

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const sRaw = params.get("s");
  const session = sRaw ? decodeScores(sRaw) : null;
  const rRaw = params.get("r");
  const reply = rRaw ? decodeReply(rRaw) : null;
  return { session, reply, sRaw };
}

function lowestIndex(list) {
  let idx = 0;
  for (let i = 1; i < list.length; i++) if (list[i] < list[idx]) idx = i;
  return idx;
}

function Track({ value, onChange }) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);

  const updateFromClientX = (clientX) => {
    const rect = ref.current.getBoundingClientRect();
    const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    onChange(Math.max(1, Math.round(pct * 10)));
  };

  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    updateFromClientX(e.clientX);
  };
  const onMove = (e) => {
    if (!dragging) return;
    updateFromClientX(e.clientX);
  };
  const onUp = () => setDragging(false);

  const pct = (value / 10) * 100;

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      style={{
        position: "relative", width: "100%", height: 10, borderRadius: 9999,
        background: TOKENS.line, touchAction: "none", cursor: "pointer",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, borderRadius: 9999, background: TOKENS.gold, transition: dragging ? "none" : "width 0.15s ease-out" }} />
      <div
        style={{
          position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%, -50%)",
          width: 20, height: 20, borderRadius: "9999px", background: TOKENS.gold,
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)", transition: dragging ? "none" : "left 0.15s ease-out",
        }}
      />
    </div>
  );
}

export default function RechargeGame() {
  const [{ session, reply, sRaw }] = useState(readParams);
  const isReplyView = session !== null && reply !== null;
  const isViewer = session !== null && reply === null;

  const [scores, setScores] = useState(() => Array(DIMENSIONS.length).fill(5));
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState("score"); // score | charging | result
  const [copied, setCopied] = useState(false);
  const [messageRoll] = useState(() => Math.random());
  const [tipRoll] = useState(() => Math.random());

  const [replyText, setReplyText] = useState("");
  const [replyCopied, setReplyCopied] = useState(false);

  const setScore = (i, value) => {
    setScores((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  const startCharge = () => {
    setPhase("charging");
    setTimeout(() => setPhase("result"), 1300);
  };

  const copyResultLink = async () => {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}games/recharge?s=${encodeScores(scores, note)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    const link = `${window.location.origin}${import.meta.env.BASE_URL}games/recharge?s=${sRaw}&r=${encodeReply(text)}`;
    try {
      await navigator.clipboard.writeText(link);
      setReplyCopied(true);
      setTimeout(() => setReplyCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (isReplyView) {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={16} color={TOKENS.gold} />
          <span style={{ color: TOKENS.gold, fontSize: 12, fontWeight: 700 }}>A message for you</span>
        </div>
        <div
          style={{
            background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
            border: `1px solid ${TOKENS.gold}55`,
            borderRadius: 16,
            padding: "18px 20px",
          }}
          className="w-full"
        >
          <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 17, lineHeight: 1.45 }}>{reply}</p>
        </div>
      </div>
    );
  }

  if (isViewer) {
    const lowest = DIMENSIONS[lowestIndex(session.scores)].label;
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-6">
          Here's how Ganira's doing
        </p>
        <div className="w-full flex flex-col gap-4 mb-5">
          {DIMENSIONS.map((d, i) => (
            <div key={d.key} className="w-full">
              <div className="flex justify-between mb-1.5" style={{ fontSize: 12.5 }}>
                <span style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif" }}>{d.label}</span>
                <span style={{ color: TOKENS.gold, fontWeight: 700 }}>{session.scores[i]}/10</span>
              </div>
              <div style={{ width: "100%", height: 8, borderRadius: 9999, background: TOKENS.line, overflow: "hidden" }}>
                <div style={{ width: `${session.scores[i] * 10}%`, height: "100%", background: TOKENS.gold }} />
              </div>
            </div>
          ))}
        </div>
        {session.note.trim() && (
          <div style={{ border: `1px dashed ${TOKENS.line}`, borderRadius: 12, padding: "10px 14px", marginBottom: 12 }} className="w-full">
            <span style={{ color: TOKENS.gold, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Her note</span>
            <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 13.5, marginTop: 4, lineHeight: 1.4 }}>{session.note}</p>
          </div>
        )}
        <p style={{ color: TOKENS.muted, fontSize: 12, textAlign: "center" }} className="mb-6">
          {lowest} was her lowest today — might be worth checking in.
        </p>

        <div className="w-full flex gap-2 mb-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendReply()}
            placeholder="Send something back..."
            style={{
              flex: 1, background: TOKENS.bgCard, border: `1px solid ${TOKENS.line}`, borderRadius: 8,
              color: TOKENS.cream, fontFamily: "'Manrope', sans-serif", fontSize: 12.5, padding: "8px 10px",
            }}
          />
          <button
            onClick={sendReply}
            disabled={!replyText.trim()}
            aria-label="Send reply"
            style={{
              flexShrink: 0, width: 34, height: 34, borderRadius: 8, border: `1px solid ${TOKENS.line}`,
              color: TOKENS.gold, display: "flex", alignItems: "center", justifyContent: "center",
              opacity: replyText.trim() ? 1 : 0.4,
            }}
          >
            {replyCopied ? <Check size={16} /> : <Send size={16} />}
          </button>
        </div>
        {replyCopied && (
          <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }}>Link copied — send it to her.</p>
        )}
      </div>
    );
  }

  if (phase === "charging") {
    const cat = DIMENSIONS[lowestIndex(scores)].key;
    const { Icon, text } = CHARGE_CONFIG[cat];
    return (
      <div className="w-full flex flex-col items-center justify-center" style={{ minHeight: 260 }}>
        <Icon size={40} color={TOKENS.gold} className="rg-charge-pulse" />
        <p style={{ color: TOKENS.muted, fontSize: 13 }} className="mt-4 mb-4">
          {text}
        </p>
        <div style={{ width: "100%", maxWidth: 220, height: 8, borderRadius: 9999, background: TOKENS.line, overflow: "hidden" }}>
          <div className="rg-charge-fill" style={{ height: "100%", background: TOKENS.gold }} />
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const cat = DIMENSIONS[lowestIndex(scores)].key;
    const messages = RECHARGE_MESSAGES[cat];
    const tips = RECHARGE_TIPS[cat];
    const message = messages[Math.floor(messageRoll * messages.length)];
    const tip = tips[Math.floor(tipRoll * tips.length)];
    return (
      <div className="w-full flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <BatteryCharging size={16} color={TOKENS.gold} />
          <span style={{ color: TOKENS.gold, fontSize: 12, fontWeight: 700 }}>Fully charged</span>
        </div>
        <div
          style={{
            background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
            border: `1px solid ${TOKENS.gold}55`,
            borderRadius: 16,
            padding: "18px 20px",
            marginBottom: 12,
          }}
          className="w-full"
        >
          <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 17, lineHeight: 1.45 }}>{message}</p>
        </div>
        <div
          style={{
            border: `1px dashed ${TOKENS.line}`,
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 16,
          }}
          className="w-full"
        >
          <span style={{ color: TOKENS.gold, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Try this</span>
          <p style={{ color: TOKENS.muted, fontSize: 12.5, marginTop: 4 }}>{tip}</p>
        </div>
        <button
          onClick={copyResultLink}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2"
        >
          {copied ? <Check size={17} /> : <Link2 size={17} />} {copied ? "Link copied" : "Copy result link to send"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-6">
        Drag to score how you're doing right now
      </p>
      <div className="w-full flex flex-col gap-6 mb-6">
        {DIMENSIONS.map((d, di) => (
          <div key={d.key} className="w-full">
            <div className="flex justify-between mb-2.5" style={{ fontSize: 13 }}>
              <span style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif" }}>{d.label}</span>
              <span style={{ color: TOKENS.gold, fontWeight: 700 }}>{scores[di]}/10</span>
            </div>
            <Track value={scores[di]} onChange={(v) => setScore(di, v)} />
          </div>
        ))}
      </div>

      <div className="w-full mb-6">
        <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 14 }} className="mb-2">
          Anything you want to add? (optional)
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's going on, if you want to say..."
          rows={3}
          style={{
            width: "100%", background: TOKENS.bgCard, border: `1px solid ${TOKENS.line}`, borderRadius: 8,
            color: TOKENS.cream, fontFamily: "'Manrope', sans-serif", fontSize: 12.5, padding: "8px 10px", resize: "none",
          }}
        />
      </div>

      <button
        onClick={startCharge}
        style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
        className="w-full h-12 rounded-full flex items-center justify-center gap-2"
      >
        Show me something
      </button>
    </div>
  );
}
