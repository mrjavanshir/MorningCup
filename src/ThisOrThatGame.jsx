import React, { useState } from "react";
import { ArrowRight, Check, Link2, X } from "lucide-react";
import { TOKENS } from "./messages.js";

const PARTY_A = "Javanshir";
const PARTY_B = "Ganira";

const PAIRS = [
  ["Mountains", "Beach"],
  ["Coffee", "Tea"],
  ["Morning person", "Night owl"],
  ["Texting", "Calling"],
  ["Sweet", "Savory"],
  ["Books", "Movies"],
  ["City life", "Countryside"],
  ["Planned trips", "Spontaneous trips"],
  ["Dogs", "Cats"],
  ["Staying in", "Going out"],
];

function encodePicks(picks) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(picks))));
}

function decodePicks(raw) {
  try {
    const val = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (!Array.isArray(val) || val.length !== PAIRS.length) return null;
    return val;
  } catch {
    return null;
  }
}

function readParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    a: params.has("a") ? decodePicks(params.get("a")) : null,
    b: params.has("b") ? decodePicks(params.get("b")) : null,
  };
}

function labelFor(pair, val) {
  return typeof val === "string" ? val : pair[val];
}

function valuesMatch(x, y) {
  if (typeof x === "string" || typeof y === "string") {
    return typeof x === "string" && typeof y === "string" && x.trim().toLowerCase() === y.trim().toLowerCase();
  }
  return x === y;
}

function overlapCount(x, y) {
  return x.filter((v, i) => valuesMatch(v, y[i])).length;
}

function ComparisonRows({ mine, theirs, mineLabel, theirsLabel }) {
  return (
    <div className="w-full flex flex-col gap-2 mb-5">
      {PAIRS.map((pair, i) => {
        const match = valuesMatch(mine[i], theirs[i]);
        return (
          <div
            key={i}
            style={{
              background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
              border: `1px solid ${match ? TOKENS.gold + "55" : TOKENS.line}`,
              borderRadius: 12,
              padding: "10px 14px",
            }}
            className="w-full flex items-center justify-between gap-2"
          >
            <div style={{ fontSize: 12.5 }}>
              <div style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif" }}>
                {mineLabel}: {labelFor(pair, mine[i])}
              </div>
              <div style={{ color: TOKENS.muted, marginTop: 2 }}>
                {theirsLabel}: {labelFor(pair, theirs[i])}
              </div>
            </div>
            {match ? <Check size={16} color={TOKENS.gold} /> : <X size={16} color={TOKENS.muted} />}
          </div>
        );
      })}
    </div>
  );
}

export default function ThisOrThatGame() {
  const [{ a: paramA, b: paramB }] = useState(readParams);
  const isReveal = paramA !== null && paramB !== null;
  const isCompareMode = paramA !== null && paramB === null;

  const [answers, setAnswers] = useState(() => Array(PAIRS.length).fill(null));
  const [step, setStep] = useState(0);
  const [customText, setCustomText] = useState("");
  const [copied, setCopied] = useState(false);

  const done = !isReveal && step >= PAIRS.length;

  const recordPick = (value) => {
    if (done) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = value;
      return next;
    });
    setCustomText("");
    setTimeout(() => setStep((s) => s + 1), 250);
  };

  const pickCustom = () => {
    const text = customText.trim();
    if (!text) return;
    recordPick(text);
  };

  const copyLink = async (query) => {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}games/this-or-that?${query}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (isReveal) {
    const score = overlapCount(paramA, paramB);
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-2">
          {score} of {PAIRS.length} picks matched
        </p>
        <p style={{ color: TOKENS.gold, fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, textAlign: "center" }} className="mb-6">
          {Math.round((score / PAIRS.length) * 100)}% overlap
        </p>
        <ComparisonRows mine={paramA} theirs={paramB} mineLabel={PARTY_A} theirsLabel={PARTY_B} />
      </div>
    );
  }

  if (done && isCompareMode) {
    const score = overlapCount(paramA, answers);
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-2">
          {score} of {PAIRS.length} picks matched
        </p>
        <p style={{ color: TOKENS.gold, fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, textAlign: "center" }} className="mb-6">
          {Math.round((score / PAIRS.length) * 100)}% overlap
        </p>
        <ComparisonRows mine={answers} theirs={paramA} mineLabel="You" theirsLabel={PARTY_A} />
        <button
          onClick={() => copyLink(`a=${encodePicks(paramA)}&b=${encodePicks(answers)}`)}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2"
        >
          {copied ? <Check size={17} /> : <Link2 size={17} />} {copied ? "Link copied" : "Copy result link to send back"}
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-6">
          Your picks are locked in — send the link to see how they compare.
        </p>
        <button
          onClick={() => copyLink(`a=${encodePicks(answers)}`)}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2"
        >
          {copied ? <Check size={17} /> : <Link2 size={17} />} {copied ? "Link copied" : "Copy link to send"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        {isCompareMode ? `${PARTY_A} already picked — now it's your turn` : "Pick a side, or write your own"}
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-5">
        {step + 1} / {PAIRS.length}
      </p>

      <div className="flex gap-1.5 mb-6">
        {PAIRS.map((_, i) => (
          <span
            key={i}
            style={{ width: 7, height: 7, borderRadius: 9999, background: i < step ? TOKENS.gold : TOKENS.line }}
          />
        ))}
      </div>

      <div className="w-full flex flex-col gap-3">
        {PAIRS[step].map((option, i) => (
          <button
            key={i}
            onClick={() => recordPick(i)}
            style={{
              background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
              border: `1px solid ${TOKENS.line}`,
              borderRadius: 16,
              padding: "22px 18px",
              color: TOKENS.cream,
              fontFamily: "'Fraunces', serif",
              fontSize: 17,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {option}
          </button>
        ))}

        <div className="flex gap-2">
          <input
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && pickCustom()}
            placeholder="Or write your own..."
            style={{
              flex: 1, background: TOKENS.bgCard, border: `1px solid ${TOKENS.line}`, borderRadius: 8,
              color: TOKENS.cream, fontFamily: "'Manrope', sans-serif", fontSize: 12.5, padding: "8px 10px",
            }}
          />
          <button
            onClick={pickCustom}
            disabled={!customText.trim()}
            aria-label="Submit custom answer"
            style={{
              flexShrink: 0, width: 34, height: 34, borderRadius: 8, border: `1px solid ${TOKENS.line}`,
              color: TOKENS.gold, display: "flex", alignItems: "center", justifyContent: "center",
              opacity: customText.trim() ? 1 : 0.4,
            }}
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
