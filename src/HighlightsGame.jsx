import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, Link2, Sunset } from "lucide-react";
import { TOKENS } from "./messages.js";

const PARTY_A = "Javanshir";
const PARTY_B = "Ganira";

function encode(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function decode(raw) {
  try {
    const s = decodeURIComponent(escape(atob(raw)));
    return s.trim() ? s : null;
  } catch {
    return null;
  }
}

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const a = params.get("a");
  const b = params.get("b");
  return { his: a ? decode(a) : null, hers: b ? decode(b) : null, rawA: a };
}

function Card({ who, text, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 24, delay }}
      style={{
        background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
        border: `1px solid ${TOKENS.gold}44`,
        borderRadius: 14,
        padding: "14px 16px",
      }}
      className="w-full"
    >
      <span style={{ color: TOKENS.gold, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase" }}>
        {who}
      </span>
      <p style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 15, lineHeight: 1.45, marginTop: 5 }}>
        {text}
      </p>
    </motion.div>
  );
}

export default function HighlightsGame() {
  const [{ his, hers, rawA }] = useState(readParams);
  const isReveal = his !== null && hers !== null;
  const isReplying = his !== null && hers === null;

  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const ready = text.trim().length > 0;

  const copyLink = async (query) => {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}games/highlights?${query}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (isReveal) {
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-6">
          Best parts of the day
        </p>
        <div className="w-full flex flex-col gap-2.5">
          <Card who={PARTY_A} text={his} delay={0} />
          <Card who={PARTY_B} text={hers} delay={0.12} />
        </div>
      </div>
    );
  }

  if (sent) {
    const query = isReplying ? `a=${rawA}&b=${encode(text.trim())}` : `a=${encode(text.trim())}`;
    return (
      <div className="w-full flex flex-col items-center">
        {isReplying && (
          <div className="w-full flex flex-col gap-2.5 mb-5">
            <Card who={PARTY_A} text={his} delay={0} />
            <Card who="You" text={text.trim()} delay={0.12} />
          </div>
        )}
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-5">
          {isReplying ? "Send it back so he sees both." : "Now send it and see what his was."}
        </p>
        <motion.button
          onClick={() => copyLink(query)}
          whileTap={{ scale: 0.97 }}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2"
        >
          {copied ? <Check size={17} /> : <Link2 size={17} />} {copied ? "Link copied" : "Copy the link"}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        Best part of your day
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-6">
        {isReplying ? "His is already in. You won't see it until you've written yours." : "One thing. It can be tiny."}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        style={{
          width: "100%",
          background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
          border: `1px solid ${ready ? TOKENS.gold + "44" : TOKENS.line}`,
          borderRadius: 14,
          padding: "12px 14px",
          marginBottom: 18,
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="The bit that actually made the day worth it"
          rows={3}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            color: TOKENS.cream,
            fontFamily: "'Manrope', sans-serif",
            fontSize: 13.5,
            lineHeight: 1.6,
          }}
        />
      </motion.div>

      <motion.button
        onClick={() => setSent(true)}
        disabled={!ready}
        whileTap={ready ? { scale: 0.97 } : undefined}
        style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700, opacity: ready ? 1 : 0.5 }}
        className="w-full h-12 rounded-full flex items-center justify-center gap-2"
      >
        <Sunset size={16} /> That was it
      </motion.button>
    </div>
  );
}
