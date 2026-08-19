import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Link2, X } from "lucide-react";
import { TOKENS } from "./messages.js";
import { loadState, saveState } from "./store.js";

const PARTY_A = "Javanshir";
const PARTY_B = "Ganira";
const LIE_COLOR = "#C4184F";

function validRound(value) {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [statements, lieIndex] = value;
  if (!Array.isArray(statements) || statements.length !== 3) return null;
  if (statements.some((s) => typeof s !== "string" || !s.trim())) return null;
  if (typeof lieIndex !== "number" || lieIndex < 0 || lieIndex > 2) return null;
  return { statements, lieIndex };
}

function guessFromUrl(hasRound) {
  const g = new URLSearchParams(window.location.search).get("g");
  return hasRound && g !== null && /^[0-2]$/.test(g) ? Number(g) : null;
}

function StatementCard({ text, index, state, onClick, disabled }) {
  const isLie = state === "lie";
  const isTruth = state === "truth";
  const isPicked = state === "picked";

  const borderColor = isLie ? LIE_COLOR : isPicked ? TOKENS.gold : TOKENS.line;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: isTruth ? 0.45 : 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24, delay: index * 0.12 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      style={{
        width: "100%",
        textAlign: "left",
        background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
        padding: "14px 16px",
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          marginTop: 1,
          width: 20,
          height: 20,
          borderRadius: 9999,
          border: `1.5px solid ${borderColor}`,
          color: isLie ? LIE_COLOR : TOKENS.gold,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        {isLie ? <X size={12} /> : isPicked ? <Check size={12} /> : index + 1}
      </span>
      <span style={{ color: TOKENS.cream, fontFamily: "'Fraunces', serif", fontSize: 14.5, lineHeight: 1.4 }}>
        {text}
      </span>
    </motion.button>
  );
}

export default function TruthsGame() {
  // The round may live behind a short id, so opening a link is now a fetch.
  const [loading, setLoading] = useState(() => /[?&][ai]=/.test(window.location.search));
  const [round, setRound] = useState(null);
  const [token, setToken] = useState(null); // { param, value } — reused for the reply link
  const [urlGuess, setUrlGuess] = useState(null);

  const [statements, setStatements] = useState(["", "", ""]);
  const [lieIndex, setLieIndex] = useState(null);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [guess, setGuess] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!loading) return undefined;
    (async () => {
      const loaded = await loadState();
      if (cancelled) return;
      const parsed = loaded ? validRound(loaded.data) : null;
      if (parsed) {
        setRound(parsed);
        setToken({ param: loaded.param, value: loaded.value });
        setUrlGuess(guessFromUrl(true));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loading]);

  const isResult = round !== null && urlGuess !== null;
  const isGuessing = round !== null && urlGuess === null;

  const ready = statements.every((s) => s.trim()) && lieIndex !== null;

  const setStatement = (i, value) =>
    setStatements((prev) => prev.map((s, idx) => (idx === i ? value : s)));

  const copyLink = async (query) => {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}games/truths?${query}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const copyRoundLink = async () => {
    const { param, value } = await saveState([statements.map((s) => s.trim()), lieIndex]);
    await copyLink(`${param}=${value}`);
  };

  const copyResultLink = async () => {
    if (!token) return;
    await copyLink(`${token.param}=${token.value}&g=${guess}`);
  };

  const cardState = (i, revealedGuess) => {
    if (revealedGuess === null) return "idle";
    if (i === round.lieIndex) return "lie";
    if (i === revealedGuess) return "picked";
    return "truth";
  };

  if (loading) {
    return (
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mt-6">
        Opening…
      </p>
    );
  }

  // --- Author sees how she did ---
  if (isResult) {
    const correct = urlGuess === round.lieIndex;
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
          {PARTY_B} guessed
        </p>
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 18 }}
          style={{
            color: correct ? TOKENS.gold : LIE_COLOR,
            fontFamily: "'Fraunces', serif",
            fontSize: 20,
            fontWeight: 600,
            textAlign: "center",
          }}
          className="mb-6"
        >
          {correct ? "She got it right )" : "She fell for it"}
        </motion.p>
        <div className="w-full flex flex-col gap-2.5">
          {round.statements.map((s, i) => (
            <StatementCard key={i} text={s} index={i} state={cardState(i, urlGuess)} disabled />
          ))}
        </div>
      </div>
    );
  }

  // --- She guesses ---
  if (isGuessing) {
    const revealed = guess !== null;
    const correct = guess === round.lieIndex;
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
          {PARTY_A} wrote three things about himself
        </p>
        <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-6">
          {revealed ? " " : "Two are true. Tap the lie."}
        </p>

        <div className="w-full flex flex-col gap-2.5 mb-5">
          {round.statements.map((s, i) => (
            <StatementCard
              key={i}
              text={s}
              index={i}
              state={cardState(i, guess)}
              disabled={revealed}
              onClick={() => setGuess(i)}
            />
          ))}
        </div>

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
              className="w-full flex flex-col items-center"
            >
              <motion.p
                animate={correct ? {} : { x: [0, -8, 8, -5, 5, 0] }}
                transition={{ duration: 0.45 }}
                style={{
                  color: correct ? TOKENS.gold : LIE_COLOR,
                  fontFamily: "'Fraunces', serif",
                  fontSize: 19,
                  fontWeight: 600,
                  textAlign: "center",
                }}
                className="mb-4"
              >
                {correct ? "Correct — that was the lie )" : "Nope, that one was true."}
              </motion.p>
              <motion.button
                onClick={copyResultLink}
                whileTap={{ scale: 0.97 }}
                style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
                className="w-full h-12 rounded-full flex items-center justify-center gap-2"
              >
                {copied ? <Check size={17} /> : <Link2 size={17} />} {copied ? "Link copied" : "Send him the result"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- Author writes the round ---
  if (sent) {
    return (
      <div className="w-full flex flex-col items-center">
        <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-6">
          Round locked in — send the link and see if she can spot the lie.
        </p>
        <motion.button
          onClick={copyRoundLink}
          whileTap={{ scale: 0.97 }}
          style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700 }}
          className="w-full h-12 rounded-full flex items-center justify-center gap-2"
        >
          {copied ? <Check size={17} /> : <Link2 size={17} />} {copied ? "Link copied" : "Copy link to send"}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p style={{ color: TOKENS.muted, fontSize: 13, textAlign: "center" }} className="mb-1">
        Write three things about yourself
      </p>
      <p style={{ color: TOKENS.muted, fontSize: 11.5, textAlign: "center" }} className="mb-6">
        Two true, one made up — then mark the lie
      </p>

      <div className="w-full flex flex-col gap-3 mb-5">
        {statements.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24, delay: i * 0.08 }}
            style={{
              background: `linear-gradient(160deg, ${TOKENS.bgCard}, ${TOKENS.bgCardEdge})`,
              border: `1px solid ${lieIndex === i ? LIE_COLOR : TOKENS.line}`,
              borderRadius: 14,
              padding: "12px 14px",
            }}
          >
            <input
              value={s}
              onChange={(e) => setStatement(i, e.target.value)}
              placeholder={`Statement ${i + 1}`}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: TOKENS.cream,
                fontFamily: "'Manrope', sans-serif",
                fontSize: 13,
                marginBottom: 8,
              }}
            />
            <button
              onClick={() => setLieIndex(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: lieIndex === i ? LIE_COLOR : TOKENS.muted,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  border: `1.5px solid ${lieIndex === i ? LIE_COLOR : TOKENS.line}`,
                  background: lieIndex === i ? LIE_COLOR : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {lieIndex === i && <Check size={9} color={TOKENS.cream} />}
              </span>
              This one's the lie
            </button>
          </motion.div>
        ))}
      </div>

      <motion.button
        onClick={() => setSent(true)}
        disabled={!ready}
        whileTap={ready ? { scale: 0.97 } : undefined}
        style={{ background: TOKENS.gold, color: TOKENS.bgDeep, fontWeight: 700, opacity: ready ? 1 : 0.5 }}
        className="w-full h-12 rounded-full flex items-center justify-center gap-2"
      >
        Done
      </motion.button>
    </div>
  );
}
